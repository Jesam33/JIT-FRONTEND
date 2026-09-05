"use client";

import { useEffect } from "react";
import { getTenantSlug } from "@/lib/tenant-client";
import { initialMarkDataUri } from "@/lib/initial-mark";

const PRIMARY = process.env.NEXT_PUBLIC_PRIMARY_TENANT_SLUG ?? "jorsas";

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
//
// `fallbackColor` (the academy's primary color) drives a GENERATED initial mark
// for a NON-primary academy that has no uploaded logo: rather than leak the
// Jorsas "J", the tab shows the academy's initial (from its tenant slug) on its
// brand color. The generated mark never overwrites a real logo — it only fills
// the gap when `href` is absent and the tenant is not the Jorsas primary.
export default function DynamicFavicon({ href, fallbackColor }: { href?: string | null; fallbackColor?: string | null }) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const head = document.head;

    if (href) {
      // Real logo — replace any brand favicon we set previously so there is
      // exactly one and it reflects the current logo.
      head.querySelectorAll("link[data-brand-favicon]").forEach((l) => l.remove());
      const link = document.createElement("link");
      link.rel = "icon";
      link.setAttribute("data-brand-favicon", "");
      link.href = href;
      head.appendChild(link);
      return;
    }

    // No logo. Generate an initial mark for a NON-primary academy so the tab
    // never shows the Jorsas "J". The primary keeps its own (root metadata)
    // icon, so we do nothing there — and, per rule 1, we never tear down an
    // existing favicon to reveal the default.
    const slug = getTenantSlug();
    if (!slug || slug === PRIMARY) return;

    // Never clobber a real logo (e.g. one the pre-paint set from cached
    // branding): if any existing brand favicon is a real URL, leave it. Only a
    // previously-generated data: mark may be refreshed to the current color.
    const existing = Array.from(head.querySelectorAll<HTMLLinkElement>("link[data-brand-favicon]"));
    if (existing.some((l) => !l.href.startsWith("data:"))) return;
    existing.forEach((l) => l.remove());

    const link = document.createElement("link");
    link.rel = "icon";
    link.setAttribute("data-brand-favicon", "");
    link.href = initialMarkDataUri(slug, fallbackColor ?? null);
    head.appendChild(link);
  }, [href, fallbackColor]);

  return null;
}
