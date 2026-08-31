"use client";

import { useEffect } from "react";

// Swaps the browser-tab icon to the institute's own logo at runtime (owners /
// staff / students otherwise see the Jorsas favicon inside a customised
// institute). Next only supports a single static app-level icon, so per-tenant
// tab icons are applied on the client.
//
// Two rules keep the tab icon stable:
//
//  1. A FALSY href is a NO-OP. We NEVER tear down an existing brand favicon to
//     reveal the default Jorsas icon. The pre-paint script in app/layout.tsx
//     sets the institute icon (from cached branding) before React hydrates; the
//     portal shell then briefly renders with a null logo — the authenticated
//     overview fetch is still in flight, and right after login the branding
//     cookie isn't written yet. An earlier version wiped the icon on that
//     transient null and re-added it only once a logo arrived; if the fetch was
//     slow or errored, the tab was left showing Jorsas. That was the "it showed
//     my logo, then reverted to the Jorsas logo after login" bug.
//
//  2. We only ever manage our own [data-brand-favicon] link(s) — never Next's
//     React-managed icon nodes (an even earlier version removed/re-appended
//     those and corrupted React's DOM bookkeeping: "Cannot read properties of
//     null (reading 'removeChild')"). Browsers honour the LAST icon link in the
//     document, so appending ours after Next's makes the institute logo win
//     without touching anything React owns.
//
// This component is purely additive: it applies a brand favicon and swaps it for
// a newer one when the logo changes, but it never removes one back to the
// default. A full page load (which resets <head>) or the next area's own favicon
// handles reverting to Jorsas; platform pages that must look default call
// resetBrandingToDefault() explicitly (see lib/branding-cache.ts).
export default function DynamicFavicon({ href }: { href?: string | null }) {
  useEffect(() => {
    if (typeof document === "undefined" || !href) return;
    const head = document.head;

    // Replace any brand favicon we (or the pre-paint script) set previously, so
    // there is exactly one and it reflects the current logo.
    head.querySelectorAll("link[data-brand-favicon]").forEach((l) => l.remove());

    const link = document.createElement("link");
    link.rel = "icon";
    link.setAttribute("data-brand-favicon", "");
    link.href = href;
    head.appendChild(link);
  }, [href]);

  return null;
}
