"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// A slim top-of-viewport progress bar that signals "something is loading" during
// client-side navigations — the global counterpart to our per-button spinners
// (fix #2: "anything that involves a delay before response … let's have a
// loader"). It is a pure OVERLAY: it never replaces page content. (An earlier
// attempt swapped children for a spinner on link mousedown and bounced clicks
// back to the dashboard — see OwnerLayoutClient. This must stay an overlay.)
//
// It starts when an internal link/router navigation begins (captured document
// click) and completes when the URL — path or query — actually changes. A safety
// timeout force-completes so the bar can never get stuck.
export default function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);

  const active = useRef(false);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTrickle = () => {
    if (trickle.current) {
      clearInterval(trickle.current);
      trickle.current = null;
    }
  };

  const finish = useCallback(() => {
    if (!active.current) return;
    active.current = false;
    clearTrickle();
    if (safety.current) {
      clearTimeout(safety.current);
      safety.current = null;
    }
    setWidth(100);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 400);
  }, []);

  const start = useCallback(() => {
    if (active.current) return;
    active.current = true;
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setVisible(true);
    setWidth(8);
    clearTrickle();
    // Ease toward ~90% while we wait; never reach 100% until navigation ends.
    trickle.current = setInterval(() => {
      setWidth((w) => (w < 90 ? w + Math.max(0.5, (90 - w) * 0.12) : w));
    }, 200);
    if (safety.current) clearTimeout(safety.current);
    safety.current = setTimeout(finish, 8000);
  }, [finish]);

  // Detect the START of a navigation from a click on an internal link.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      let dest: URL;
      try {
        dest = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      // Only same-origin navigations to a genuinely different URL.
      if (dest.origin !== window.location.origin) return;
      if (dest.href === window.location.href) return;
      start();
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      clearTrickle();
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (safety.current) clearTimeout(safety.current);
    };
  }, [start]);

  // Complete when the URL actually changes (path or query string). The first run
  // is a no-op because no navigation is active yet.
  useEffect(() => {
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 250ms ease" }}
    >
      <div
        className="h-full bg-site-primary"
        style={{
          width: `${width}%`,
          transition: "width 200ms ease",
          boxShadow: "0 0 10px var(--color-site-primary, #ed180d), 0 0 5px var(--color-site-primary, #ed180d)",
        }}
      />
    </div>
  );
}
