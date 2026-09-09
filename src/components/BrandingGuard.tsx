"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { resetBrandingToDefault } from "@/lib/branding-cache";
import { tenantSubdomainForHost } from "@/lib/tenant-subdomain";

// The global `branding-init` pre-paint (app/layout.tsx) writes the active
// institute's palette onto :root to kill the portal flash-of-default-theme.
// Those inline custom properties live on <html> and PERSIST across client-side
// navigation, the beforeInteractive script only re-runs on a full page load, 
// so clicking from a customised institute's portal back to the Jorsas
// marketing site would otherwise leave the institute's red painted on the
// landing page's buttons.
//
// Whenever we land on a primary/marketing route (anything OUTSIDE the /lms
// portals and /i institute mini-sites) revert :root to the default Jorsas
// theme. On branded routes we do nothing and let the portal / storefront shells
// apply their own colors. The branded-area check mirrors AppChrome.tsx exactly.
// Renders nothing.
//
// This MUST run as a layout effect, not a plain effect: on client-side
// navigation React commits the new route's DOM and then runs layout effects
// *before* the browser paints, whereas a useEffect fires *after* the first
// paint. With useEffect, the marketing page paints one frame with the stale
// institute :root still in place (its buttons flash the institute color via
// `.bg-site-primary` / the [data-branded] rules in globals.css) and only
// corrects on the next frame, the intermittent "the buttons changed" bleed.
// A layout effect resets :root before that first paint, so there is no flash.
// useLayoutEffect is unavailable during SSR (React warns), so we fall back to
// useEffect on the server, where this side-effect does not apply anyway.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function BrandingGuard() {
  const pathname = usePathname() ?? "";

  // A tenant subdomain origin is a branded area even though usePathname() is
  // "/" there (the middleware rewrites {academy}.domain/ to /i/{slug}, and a
  // rewrite never changes the browser URL — see AppChrome.tsx). This component
  // renders null in every state, so a lazy window read cannot cause a hydration
  // mismatch; initializing it (rather than flipping it in an effect) means the
  // FIRST layout-effect pass already knows, so it never wrongly resets an
  // academy's palette while its storefront is on screen.
  const [tenantHost] = useState(
    () =>
      typeof window !== "undefined" &&
      tenantSubdomainForHost(window.location.hostname) !== null,
  );

  useIsomorphicLayoutEffect(() => {
    const branded =
      tenantHost || pathname.startsWith("/lms") || pathname === "/i" || pathname.startsWith("/i/");
    if (!branded) resetBrandingToDefault();
  }, [pathname, tenantHost]);

  return null;
}
