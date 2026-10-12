"use client";

// The teacher's "⏺ Record" button (beside Host) and the recording bar that
// stays on screen while a recording runs, on any portal page. The recording
// itself lives in lib/class-recorder (free, in the browser, saved to the
// teacher's computer; students see a "Recording" badge meanwhile).

import { useEffect, useState } from "react";
import { canRecordClasses, dismissRecorderMessage, startRecording, stopRecording, useClassRecorder } from "@/lib/class-recorder";

function elapsed(from?: number, now = Date.now()): string {
  if (!from) return "0:00";
  const s = Math.max(0, Math.floor((now - from) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** "⏺ Record" for one class. Becomes "■ Stop" for the class being recorded. */
export function ClassRecordButton({ classType, classId, title }: { classType: string; classId: number; title?: string | null }) {
  const rec = useClassRecorder();
  const [supported, setSupported] = useState(true);
  useEffect(() => {
    (async () => setSupported(canRecordClasses()))();
  }, []);

  const mine = rec.classType === classType && rec.classId === classId;
  const busyElsewhere = rec.status !== "idle" && !mine;

  if (!supported) {
    return (
      <span className="text-[11px] text-white/40" title="Recording works on a computer, in Chrome or Edge.">
        Record: computer only
      </span>
    );
  }

  if (mine && (rec.status === "recording" || rec.status === "saving")) {
    return (
      <button
        type="button"
        onClick={stopRecording}
        disabled={rec.status === "saving"}
        className="rounded border border-red-400/50 bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-200 hover:bg-red-500/25 disabled:opacity-60"
      >
        {rec.status === "saving" ? "Saving…" : "■ Stop recording"}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={busyElsewhere || rec.status === "starting"}
      onClick={() => void startRecording({ classType, classId, title })}
      title="Records the class tab and your voice to your computer. Host the class first, then choose its tab and tick “Also share tab audio”."
      className="rounded border border-white/20 px-3 py-1 text-xs font-medium text-white hover:border-white/40 disabled:opacity-40"
    >
      {rec.status === "starting" && mine ? "Choose the class tab…" : "⏺ Record"}
    </button>
  );
}

/** Floating bar while recording (and the result afterwards). Mount once per portal shell. */
export function RecordingBar() {
  const rec = useClassRecorder();
  const [now, setNow] = useState(() => Date.now());
  const active = rec.status === "recording" || rec.status === "saving";

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  if (active) {
    return (
      <div className="fixed bottom-4 left-1/2 z-50 w-[min(94vw,30rem)] -translate-x-1/2 rounded-2xl border border-red-400/40 bg-[#1a0606]/95 p-3 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 shrink-0 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">Recording {rec.title ? `“${rec.title}”` : "the class"}</p>
            <p className="text-xs text-white/60">
              {elapsed(rec.startedAt, now)} · keep this tab open · students can see it&apos;s being recorded
            </p>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            disabled={rec.status === "saving"}
            className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-[#fff] hover:bg-red-500 disabled:opacity-60"
          >
            {rec.status === "saving" ? "Saving…" : "Stop & save"}
          </button>
        </div>
        {rec.warning ? <p className="mt-2 text-xs text-amber-200">{rec.warning}</p> : null}
      </div>
    );
  }

  if (rec.savedAs || rec.error) {
    return (
      <div className="fixed bottom-4 left-1/2 z-50 w-[min(94vw,30rem)] -translate-x-1/2 rounded-2xl border border-white/15 bg-black/90 p-3 shadow-2xl backdrop-blur">
        <div className="flex items-start gap-3">
          <p className={`min-w-0 flex-1 text-sm ${rec.error ? "text-amber-200" : "text-emerald-200"}`}>
            {rec.error
              ? rec.error
              : <>Saved to your Downloads as <span className="font-semibold">{rec.savedAs}</span>. You can upload it under Materials so students can rewatch.</>}
          </p>
          <button type="button" onClick={dismissRecorderMessage} className="shrink-0 text-xs text-white/60 hover:text-white">
            Close
          </button>
        </div>
      </div>
    );
  }

  return null;
}
