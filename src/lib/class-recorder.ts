// The teacher's free class recorder. 8x8 locks Jitsi's own Record button on
// our plan ("premium feature"), so we record in the teacher's browser instead:
//
//   1. The browser asks which tab to share: the teacher picks the class tab and
//      ticks "Also share tab audio" (the class video + everyone else's voices).
//   2. Their own microphone is mixed in (a tab's sound never includes your own
//      voice), using the Web Audio API.
//   3. MediaRecorder records it; on Stop the video downloads to their computer.
//
// Nothing is uploaded or stored by us. While it runs, the class is flagged as
// "being recorded" (STAFF_API.classRecording) so students see a badge.
// Works in Chrome and Edge on a computer (phones can't share a browser tab).
//
// A singleton outside React, so the recording survives the teacher moving
// between portal pages; components follow it with useClassRecorder().

import { useSyncExternalStore } from "react";
import { STAFF_API } from "@/lib/api";
import { apiFetchStaff } from "@/lib/fetch-with-timeout";

export type RecorderState = {
  status: "idle" | "starting" | "recording" | "saving";
  classType?: string;
  classId?: number;
  title?: string;
  startedAt?: number;
  /** Set when the class tab's sound wasn't shared (only their mic is in it). */
  warning?: string;
  error?: string;
  savedAs?: string;
};

let state: RecorderState = { status: "idle" };
const IDLE: RecorderState = { status: "idle" };
const listeners = new Set<() => void>();

let recorder: MediaRecorder | null = null;
let chunks: Blob[] = [];
let streams: MediaStream[] = [];
let audioCtx: AudioContext | null = null;
let fileExt = "webm";

function set(next: RecorderState) {
  state = next;
  listeners.forEach((l) => l());
}

export function useClassRecorder(): RecorderState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => IDLE,
  );
}

/** Whether this browser can record a tab at all (computer Chrome/Edge). */
export function canRecordClasses(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia && typeof MediaRecorder !== "undefined";
}

function pickMime(): { mimeType: string; ext: string } {
  const candidates: [string, string][] = [
    ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "mp4"],
    ["video/mp4", "mp4"],
    ["video/webm;codecs=vp9,opus", "webm"],
    ["video/webm;codecs=vp8,opus", "webm"],
    ["video/webm", "webm"],
  ];
  for (const [type, ext] of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return { mimeType: type, ext };
  }
  return { mimeType: "", ext: "webm" };
}

function flag(classType: string, classId: number, on: boolean) {
  void apiFetchStaff(STAFF_API.classRecording, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ class_type: classType, class_id: classId, on }),
  }).catch(() => undefined);
}

function cleanup() {
  streams.forEach((s) => s.getTracks().forEach((t) => t.stop()));
  streams = [];
  if (audioCtx) void audioCtx.close().catch(() => undefined);
  audioCtx = null;
  recorder = null;
  window.removeEventListener("beforeunload", warnBeforeLeaving);
}

function warnBeforeLeaving(e: BeforeUnloadEvent) {
  e.preventDefault();
  e.returnValue = "";
}

function fileName(title: string | undefined, startedAt: number | undefined): string {
  const d = new Date(startedAt ?? Date.now());
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  const name = (title || "class").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "class";
  return `${name}_${stamp}.${fileExt}`;
}

/** Must be called from a click (the browser only shows the tab picker then). */
export async function startRecording(opts: { classType: string; classId: number; title?: string | null }): Promise<void> {
  if (state.status !== "idle") return;
  if (!canRecordClasses()) {
    set({ status: "idle", error: "Recording works on a computer, in Chrome or Edge." });
    return;
  }

  set({ status: "starting", classType: opts.classType, classId: opts.classId, title: opts.title ?? undefined });

  let display: MediaStream;
  try {
    // Offer browser tabs first; "Also share tab audio" is what captures the class sound.
    display = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 24 },
      audio: true,
      preferCurrentTab: false,
      selfBrowserSurface: "exclude",
      surfaceSwitching: "include",
      systemAudio: "include",
    } as DisplayMediaStreamOptions);
  } catch {
    set({ status: "idle", error: "Recording didn't start: no tab was chosen to share." });
    return;
  }
  streams.push(display);

  // The teacher's own voice (a shared tab's sound never includes it).
  let mic: MediaStream | null = null;
  try {
    mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    streams.push(mic);
  } catch {
    /* no mic permission: record the class without their voice */
  }

  const tabHasAudio = display.getAudioTracks().length > 0;
  const tracks: MediaStreamTrack[] = [...display.getVideoTracks()];
  if (tabHasAudio || mic) {
    audioCtx = new AudioContext();
    const mix = audioCtx.createMediaStreamDestination();
    if (tabHasAudio) audioCtx.createMediaStreamSource(new MediaStream(display.getAudioTracks())).connect(mix);
    if (mic) audioCtx.createMediaStreamSource(mic).connect(mix);
    tracks.push(...mix.stream.getAudioTracks());
  }

  const { mimeType, ext } = pickMime();
  fileExt = ext;
  chunks = [];
  try {
    // ~1.5 Mbps: clear for slides and faces, about 700 MB per hour.
    recorder = new MediaRecorder(new MediaStream(tracks), {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond: 1_500_000,
    });
  } catch {
    cleanup();
    set({ status: "idle", error: "This browser can't record video. Use Chrome or Edge on a computer." });
    return;
  }

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: mimeType || "video/webm" });
    chunks = [];
    const name = fileName(state.title, state.startedAt);
    if (blob.size > 0) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
    if (state.classType && state.classId) flag(state.classType, state.classId, false);
    cleanup();
    set({ status: "idle", savedAs: blob.size > 0 ? name : undefined, error: blob.size > 0 ? undefined : "Nothing was recorded." });
  };

  // "Stop sharing" in the browser's own bar ends the recording too.
  display.getVideoTracks()[0]?.addEventListener("ended", () => stopRecording());

  recorder.start(1000);
  window.addEventListener("beforeunload", warnBeforeLeaving);
  flag(opts.classType, opts.classId, true);
  set({
    status: "recording",
    classType: opts.classType,
    classId: opts.classId,
    title: opts.title ?? undefined,
    startedAt: Date.now(),
    warning: tabHasAudio
      ? undefined
      : "The class sound isn't being recorded (\"Also share tab audio\" wasn't ticked). Stop and start again to include it.",
  });
}

export function stopRecording(): void {
  if (state.status !== "recording" || !recorder) return;
  set({ ...state, status: "saving" });
  try {
    recorder.stop(); // onstop downloads the file
  } catch {
    cleanup();
    set({ status: "idle", error: "The recording couldn't be saved." });
  }
}

/** Clear a finished recording's message. */
export function dismissRecorderMessage(): void {
  if (state.status === "idle") set({ status: "idle" });
}
