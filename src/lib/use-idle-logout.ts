"use client";

import { useEffect, useRef } from "react";

type Options = {
  /** Idle window in milliseconds. When the user is inactive this long, onIdle fires. */
  timeoutMs: number;
  /** Called once when the idle window elapses. */
  onIdle: () => void;
  /** When false, the watcher is not armed (e.g. on public/login pages). */
  enabled?: boolean;
};

// Real user-interaction events. Background XHR/polling is deliberately NOT here —
// the portals poll (chat 5s, sidebars 30s) and counting that as "activity" would
// mean the session never idles out after the user walks away.
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "wheel",
  "click",
] as const;

/**
 * Logs the user out after `timeoutMs` of no real interaction. Idle is measured by
 * wall-clock delta (Date.now) checked on an interval — not a single setTimeout —
 * so laptop sleep or a throttled background tab can't under-count elapsed time.
 */
export function useIdleLogout({ timeoutMs, onIdle, enabled = true }: Options) {
  const lastActivity = useRef<number>(Date.now());
  const fired = useRef(false);
  // Keep the latest callback without re-arming listeners each render.
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    lastActivity.current = Date.now();
    fired.current = false;

    // Capture phase + passive: catches events inside nested scroll containers too,
    // and only touches a ref (no re-render), so high-frequency events stay cheap.
    const listenerOpts = { capture: true, passive: true } as const;

    const markActive = () => {
      if (fired.current) return;
      lastActivity.current = Date.now();
    };

    const check = () => {
      if (fired.current) return;
      if (Date.now() - lastActivity.current >= timeoutMs) {
        fired.current = true;
        onIdleRef.current();
      }
    };

    ACTIVITY_EVENTS.forEach((evt) =>
      document.addEventListener(evt, markActive, listenerOpts)
    );
    // Re-check the moment a hidden tab is refocused (its interval may have been throttled).
    document.addEventListener("visibilitychange", check);

    const interval = window.setInterval(check, 15_000);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) =>
        document.removeEventListener(evt, markActive, listenerOpts)
      );
      document.removeEventListener("visibilitychange", check);
      window.clearInterval(interval);
    };
  }, [enabled, timeoutMs]);
}
