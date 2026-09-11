// Client-side helper that makes the CURRENT page installable as the ACADEMY's
// app (not the platform's). Called from inside the logged-in student/staff
// portals (see AppInstallPrompt).
//
// Browsers read a PWA's identity (name, icons, theme color, start_url) from the
// page's <link rel="manifest"> AT INSTALL TIME — and Chrome snapshots it at
// page load, before hydration. The portal layouts therefore SERVER-RENDER this
// link from the tenant cookie (see app/lms/app/layout.tsx and
// app/lms/staff/layout.tsx); the swap below is the follow-up correction for a
// stale cookie (the guards re-pin it from the authenticated session shortly
// after load, announced via the "lms-tenant-pinned" event). We only mutate the
// link's href attribute (never remove/re-append the React-owned node — that
// corrupts React's DOM bookkeeping, the DynamicFavicon lesson) and nothing
// re-renders head metadata on the portal routes, so the swap holds.
//
// iOS Safari's "Add to Home Screen" ignores the manifest's icon in favour of
// <link rel="apple-touch-icon"> and the tab title / apple-mobile-web-app-title
// meta, so those are swapped too (the logo when the academy has one; the
// generated mark route otherwise — SVG is fine for the manifest icon on
// Android, but iOS needs a bitmap, so a logo-less academy keeps the default
// apple icon there).

export type InstallRole = "student" | "staff";

function setLinkHref(rel: string, href: string): void {
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
}

function setMetaContent(name: string, content: string): void {
  let meta = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

/**
 * Point the page's install identity at the given academy. Idempotent — safe to
 * call repeatedly (the portals call it once branding resolves, so the name and
 * logo may arrive after the first call).
 */
export function applyAcademyInstallIdentity(
  slug: string,
  role: InstallRole,
  opts?: { name?: string | null; logoUrl?: string | null }
): void {
  if (typeof document === "undefined" || !slug) return;

  const encoded = encodeURIComponent(slug);

  // 1) The manifest: what Android/desktop Chrome installs.
  setLinkHref("manifest", `/pwa/${encoded}/manifest?role=${role}`);

  // 2) The iOS home-screen identity: apple-touch-icon (bitmap required, so
  //    only a real logo qualifies) + the home-screen label.
  if (opts?.logoUrl) {
    setLinkHref("apple-touch-icon", opts.logoUrl);
  }
  const name = opts?.name?.trim();
  if (name) {
    setMetaContent("apple-mobile-web-app-title", name);
  }
}
