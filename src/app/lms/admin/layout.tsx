import React from "react";
import { cookies } from "next/headers";
import OwnerLayoutClient from "@/components/OwnerLayoutClient";
import { OWNER_BRANDING_COOKIE, parseBrandingCookie } from "@/lib/owner-branding";

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
