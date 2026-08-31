import React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import OwnerLayoutClient from "@/components/OwnerLayoutClient";
import { OWNER_BRANDING_COOKIE, OWNER_NAME_COOKIE, parseBrandingCookie, parseOwnerNameCookie } from "@/lib/owner-branding";

// Server-side per-tenant browser-tab metadata for the whole /lms/admin subtree.
//
// TITLE — the academy's own name (e.g. "Perka Foundation Class"), not "Jorsas
// Tech". A nested segment's `title` REPLACES the root's static one (Next merges
// metadata shallowly; the deepest segment to define a key wins). This has to be
// set server-side: OwnerLayoutClient does set `document.title = identity.name`,
// but once this layout ships an async generateMetadata (for the icon below) Next
// STREAMS the resolved metadata title in after hydration — and since a client
// `document.title` write isn't part of that metadata, the streamed title (the
// inherited "Jorsas Tech") lands last and clobbers it. Emitting the real title
// here is the reliable fix (same lesson as the favicon). The imperative set in
// OwnerLayoutClient now only has to cover a live in-session rename.
//
// ICON — the institute's own logo as the tab favicon, the same way the /i/[slug]
// storefront does. A nested `icons` likewise REPLACES the root layout's Jorsas
// icons, so on owner pages Next emits ONLY the institute favicon — there is no
// Jorsas icon link left for the browser to fall back to. Without this, the root's
// static Jorsas icons were the only ones Next rendered here, and they beat the
// client-appended brand icon once React hydrated — the tab showed the institute
// logo for a moment, then "reverted to the Jorsas logo". (Appending a <link> last
// is not a reliable win against framework-managed metadata icons; DynamicFavicon
// stays as the instant live-update layer, but this is what makes the icon stick.)
//
// Both values come from cookies the client writes once identity/branding is known;
// they persist across sessions, so they're present on essentially every owner
// load. Before they exist (a brand-new first login) we omit that key and simply
// inherit the root's value until the next load writes the cookie. The stored
// logo_url is absolute (App\Support\MediaUrl), so Next uses it as-is rather than
// resolving it against metadataBase.
export async function generateMetadata(): Promise<Metadata> {
  const store = await cookies();
  const branding = parseBrandingCookie(store.get(OWNER_BRANDING_COOKIE)?.value);
  const name = parseOwnerNameCookie(store.get(OWNER_NAME_COOKIE)?.value);

  const meta: Metadata = {};
  if (name) meta.title = name;
  if (branding?.logo_url) meta.icons = { icon: branding.logo_url };
  return meta;
}

// Institute-owner admin area. OwnerLayoutClient supplies the sidebar + top bar
// and guards the owner session; the login/setup pages inside it render chrome-free.
//
// Reading the branding cookie here (server-side) lets us hand the client shell
// the institute's colors/font as `initialBranding`, so the FIRST rendered HTML
// already wears them — no flash of the default red/blue theme on refresh while
// the authenticated overview fetch is still in flight. The cookie is written by
// the client once branding is known; it holds no secrets (see owner-branding.ts).
export default async function OwnerAdminLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const initialBranding = parseBrandingCookie(store.get(OWNER_BRANDING_COOKIE)?.value);

  return <OwnerLayoutClient initialBranding={initialBranding}>{children}</OwnerLayoutClient>;
}
