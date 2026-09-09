"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { tenantSubdomainForHost } from "@/lib/tenant-subdomain";

type AppChromeProps = {
  children: React.ReactNode;
};

export default function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  // Routes that supply their own chrome and must NOT get the global jorsastech
  // Header/Footer: the LMS portal (/lms/*) and every per-institute mini-site
  // (/i/*), which renders an institute-branded header/footer via its own layout.
  // `startsWith("/i/")` intentionally excludes the apex "/institute" page (no
  // trailing slash), so that public page keeps the global chrome.
  //
  // The Admission Marketer flow (/become-an-agent[/apply]) is reached from an
  // academy storefront carrying ?tenant={slug}, so it must NOT wear the Jorsas
  // navbar/footer/logo. It renders its own academy-branded shell inside the page
  // (no separate layout), so we simply drop the global chrome here.
  //
  // A tenant SUBDOMAIN origin is also chrome-less: the middleware rewrites
  // {academy}.domain/ to the /i/{slug} storefront, but a rewrite never changes
  // the browser URL, so usePathname() returns "/" there (server-side and after
  // hydration alike) and the pathname checks above can't see it. The hostname is
  // the only signal, and it is readable only after mount (no window during SSR),
  // so this starts false and flips in an effect: the SSR HTML and the first
  // client render agree (no hydration mismatch), globals.css hides the chrome
  // pre-paint via html[data-tenant-subdomain] (stamped by the branding-init
  // script in app/layout.tsx), and this effect then drops it from the DOM.
  const [tenantHost, setTenantHost] = useState(false);
  useEffect(() => {
    setTenantHost(tenantSubdomainForHost(window.location.hostname) !== null);
  }, []);

  const hideGlobalChrome =
    tenantHost ||
    pathname.startsWith("/lms") ||
    pathname === "/i" ||
    pathname.startsWith("/i/") ||
    pathname.startsWith("/become-an-agent");

  return (
    <div className="site-shell">
      {hideGlobalChrome ? null : <Header />}
      <main>{children}</main>
      {hideGlobalChrome ? null : <Footer />}
    </div>
  );
}
