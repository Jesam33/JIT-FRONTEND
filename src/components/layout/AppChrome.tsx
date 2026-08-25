"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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
  const hideGlobalChrome =
    pathname.startsWith("/lms") || pathname === "/i" || pathname.startsWith("/i/");

  return (
    <div className="site-shell">
      {hideGlobalChrome ? null : <Header />}
      <main>{children}</main>
      {hideGlobalChrome ? null : <Footer />}
    </div>
  );
}
