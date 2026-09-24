"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QA_API } from "@/lib/api";
import { qaBrandName, type QaEventInfo, type QaRoomInfo, type QaSlotInfo } from "./types";

// The room behind a QA testing pass, shared by the tester and the host.
//
// One component, two modes, because they differ only in which endpoint they
// call and what they see first. A tester goes straight into their slot's room. A
// host picks which room to open, because the iungo team runs every session of
// the day from one link.
//
// The Jitsi plumbing is NOT reimplemented here. `/jitsi-meeting.html` is the
// same host the student classrooms mount, driven by query params, so the room
// behaves identically to a live class (same no-prejoin config, same
// hideConferenceSubject, same clean hang-up on leave).
//
// The payload types live in ./types, shared with the signup form: all three
// endpoints answer with the same `slotPayload()` / `eventPayload()` shapes, so
// declaring them again here is how they drift apart.

type Props = {
  mode: "tester" | "host";
  token: string;
};

type Phase = "loading" | "pick" | "room" | "blocked";

export default function QaRoom({ mode, token }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [room, setRoom] = useState<QaRoomInfo | null>(null);
  const [event, setEvent] = useState<QaEventInfo | null>(null);
  const [slots, setSlots] = useState<QaSlotInfo[]>([]);
  const [message, setMessage] = useState("");
  // Separate from `message` because the two blocked states need different
  // headings: a room that will not open yet ("not open") is a different situation
  // from one the tester just walked out of ("you left"), even though both land on
  // the same card.
  const [blockedTitle, setBlockedTitle] = useState("This room is not open");
  const [opening, setOpening] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  // Whether a room is currently mounted. Tracked in a ref rather than read from
  // state so the leave-timeout closure cannot tear down a room that was
  // re-opened in the meantime.
  const inRoomRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const brand = qaBrandName(event);

  /**
   * Open a room, or explain why it will not open.
   *
   * `slotId` is host-only. A tester has exactly one room, decided by their token.
   */
  const open = useCallback(
    async (slotId?: number) => {
      setOpening(true);
      setMessage("");

      try {
        const res = await fetch(mode === "host" ? QA_API.host(token, slotId) : QA_API.join(token));
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.jwt) {
          // A tester arriving early or late is not an error, it is a timing
          // thing, so the real window is shown rather than a bare failure.
          setBlockedTitle("This room is not open");
          setMessage(data?.message ?? "This room is not available right now.");
          setPhase("blocked");
          return;
        }

        setRoom(data as QaRoomInfo);
        setEvent(data.event as QaEventInfo);
        inRoomRef.current = true;
        setPhase("room");
      } catch {
        setBlockedTitle("Something went wrong");
        setMessage("Could not reach the server. Check your connection and try again.");
        setPhase("blocked");
      } finally {
        setOpening(false);
      }
    },
    [mode, token],
  );

  // Host first call doubles as the room picker: no `slot` means "tell me the
  // event and its rooms". Same endpoint, deliberately, so a host page never
  // needs a second round trip to learn what it can open.
  const loadPicker = useCallback(async () => {
    // Clears any banner left over from the room just left, so the picker and the
    // next room do not inherit a stale error.
    setMessage("");

    try {
      const res = await fetch(QA_API.host(token));
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setBlockedTitle("This host link is not valid");
        setMessage(data?.message ?? "This host link is not valid.");
        setPhase("blocked");
        return;
      }

      setEvent(data.event as QaEventInfo);
      setSlots((data.slots ?? []) as QaSlotInfo[]);
      setPhase("pick");
    } catch {
      setBlockedTitle("Something went wrong");
      setMessage("Could not reach the server. Check your connection and try again.");
      setPhase("blocked");
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setBlockedTitle("This link is incomplete");
      setMessage("This link is missing its access code.");
      setPhase("blocked");
      return;
    }
    if (mode === "host") void loadPicker();
    else void open();
  }, [mode, token, open, loadPicker]);

  const iframeUrl = useMemo(() => {
    if (!room) return "";
    const url = new URL("/jitsi-meeting.html", window.location.origin);
    url.searchParams.set("domain", room.domain);
    url.searchParams.set("appId", room.app_id);
    url.searchParams.set("room", room.room);
    url.searchParams.set("jwt", room.jwt);
    url.searchParams.set("userName", room.user_name);
    return url.toString();
  }, [room]);

  // The iframe tells us when the call actually ends (including when Jitsi closes
  // it from inside), so the page does not sit on a dead room.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const type = (e.data ?? {}).type;
      if (type === "jitsi-left") {
        // A left that arrives when no room is mounted is stray (a late event
        // from a room already torn down); teardown() ignores it.
        if (inRoomRef.current) teardown();
      }
      if (type === "jitsi-error") {
        // Shown as a banner over the room rather than tearing it down: Jitsi's own
        // card inside the iframe offers a Try Again that reloads the SDK, which is
        // the recovery path worth keeping. Tearing down here would throw it away.
        setMessage(typeof e.data?.detail === "string" ? e.data.detail : "The room reported a problem.");
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // teardown is recreated each render but only closes over refs and stable
    // setters, so re-subscribing on mode/loadPicker changes is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, loadPicker]);

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(document.fullscreenElement === shellRef.current);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Ask the embedded call to hang up BEFORE the iframe goes away, so the video
  // bridge drops this endpoint immediately. Without it the next join shows a
  // ghost duplicate. The iframe confirms with jitsi-left, which tears the page
  // down; the timeout is a fallback for when it never answers.
  function teardown() {
    if (!inRoomRef.current) return;
    inRoomRef.current = false;
    setRoom(null);
    if (mode === "host") {
      void loadPicker();
    } else {
      setBlockedTitle("You have left the session");
      setMessage("The same link brings you back in whenever your slot is running.");
      setPhase("blocked");
    }
  }

  function leave() {
    const frame = iframeRef.current;
    if (frame?.contentWindow) {
      try {
        frame.contentWindow.postMessage({ type: "jitsi-hangup" }, window.location.origin);
      } catch {
        /* fall through to the timeout below */
      }
      window.setTimeout(teardown, 1500);
    } else {
      teardown();
    }
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await shellRef.current?.requestFullscreen();
    } catch {
      /* refused (iOS Safari, embedded views): the room still works inline */
    }
  }

  if (phase === "loading") {
    return (
      <Shell>
        <p className="text-sm text-site-muted">Opening your room...</p>
      </Shell>
    );
  }

  if (phase === "blocked") {
    return (
      <Shell>
        <h1 className="text-xl font-semibold">{blockedTitle}</h1>
        <p className="mt-3 text-sm text-site-muted">{message}</p>
        {mode === "tester" ? (
          <p className="mt-3 text-sm text-site-muted">
            Keep the email we sent you. The link in it works whenever your session is running.
          </p>
        ) : (
          <p className="mt-3 text-sm text-site-muted">
            This link is for the session hosts only. Ask the team who set up the event if it has stopped working.
          </p>
        )}
      </Shell>
    );
  }

  if (phase === "pick") {
    return (
      <Shell>
        <h1 className="text-xl font-semibold">{event?.name ?? "Testing sessions"}</h1>
        <p className="mt-2 text-sm text-site-muted">
          Pick the room you are hosting. As host you can join before the session opens and stay after it closes.
        </p>

        <div className="mt-5 space-y-2">
          {slots.length === 0 ? (
            <p className="text-sm text-site-muted">No sessions have been set up on this event yet.</p>
          ) : (
            slots.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={opening}
                onClick={() => void open(s.id)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-site-border px-4 py-3 text-left transition hover:border-site-muted disabled:opacity-50"
              >
                <span>
                  <span className="block text-sm font-semibold">{s.label}</span>
                  {s.window ? <span className="mt-0.5 block text-xs text-site-muted">{s.window}</span> : null}
                </span>
                <span className="shrink-0 text-xs text-site-muted">
                  {s.is_open ? `${s.taken} in the room` : "Not open yet"}
                </span>
              </button>
            ))
          )}
        </div>
      </Shell>
    );
  }

  // In the room: the iframe takes the whole screen. There is no header to get in
  // the way, and on a phone the tester only has a slim bar to leave from.
  return (
    <div ref={shellRef} className="flex h-dvh flex-col bg-black">
      <div className="flex shrink-0 items-center gap-3 bg-black px-4 py-2.5 text-white">
        <span className="min-w-0 flex-1 truncate text-xs">
          <span className="font-semibold">{brand}</span>
          <span className="text-white/50"> x Jorsas Tech</span>
          {room?.slot?.label ? <span className="text-white/50"> · {room.slot.label}</span> : null}
          {room?.moderator ? <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold">Host</span> : null}
        </span>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="shrink-0 rounded-full border border-white/25 px-3 py-1.5 text-[11px] font-semibold"
        >
          {isFullscreen ? "Exit full screen" : "Full screen"}
        </button>
        <button
          type="button"
          onClick={leave}
          className="shrink-0 rounded-full border border-rose-300/40 bg-rose-500/10 px-3 py-1.5 text-[11px] font-semibold text-rose-100"
        >
          Leave
        </button>
      </div>

      <iframe
        ref={iframeRef}
        src={iframeUrl}
        className="w-full flex-1 border-none"
        allow="camera; microphone; display-capture; autoplay; fullscreen"
        allowFullScreen
        title="QA testing room"
      />

      {message ? (
        <p className="shrink-0 bg-amber-500/15 px-4 py-2 text-center text-[11px] text-amber-100">{message}</p>
      ) : null}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-site-bg px-4 py-10 text-site-text sm:px-6">
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-site-border bg-site-surface p-6">{children}</div>
    </div>
  );
}
