"use client";

import { useEffect } from "react";

// Swaps the browser-tab icon to the institute's own logo at runtime (owners /
// staff / students were still seeing the Jorsas favicon inside a customised
// institute). Next only supports a single static `app/favicon.ico`, so
// per-tenant tab icons are applied on the client.
//
// IMPORTANT — crash safety: an earlier version REMOVED Next's own icon <link>s
// and re-appended them on cleanup. Those nodes are React-managed, so putting
// them back corrupted React's DOM bookkeeping and later threw
// "Cannot read properties of null (reading 'removeChild')". This version NEVER
// touches Next's nodes. It manages a single link tagged [data-brand-favicon]
// (the same tag the pre-paint script in app/layout.tsx uses): browsers honour
// the LAST icon link in the document, so appending ours after Next's makes the
// tenant logo win without disturbing anything React owns. On href change /
// unmount we only remove our own tagged link(s).
export default function DynamicFavicon({ href }: { href?: string | null }) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const head = document.head;

    // Clear any brand favicon we (or the pre-paint script) previously added, so
    // there is only ever one and it reflects the current href.
    head.querySelectorAll("link[data-brand-favicon]").forEach((l) => l.remove());

    if (!href) return;

    const link = document.createElement("link");
    link.rel = "icon";
    link.setAttribute("data-brand-favicon", "");
    link.href = href;
    head.appendChild(link);

    return () => {
      // Remove only OUR node — never Next's. Guard the parent so a node React
      // already detached can't throw.
      if (link.parentNode) link.parentNode.removeChild(link);
    };
  }, [href]);

  return null;
}
