"use client";

import { useEffect, useState } from "react";

/**
 * Shows an "you were signed out due to inactivity" banner when the login page is
 * reached with ?timeout=1 (set by <IdleLogout />). Reads the query on the client
 * in an effect so it needs no Suspense boundary and works on every login page.
 */
export default function InactivityNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setShow(new URLSearchParams(window.location.search).get("timeout") === "1");
  }, []);

  if (!show) return null;

  return (
    <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
      You were signed out due to inactivity. Please sign in again.
    </div>
  );
}
