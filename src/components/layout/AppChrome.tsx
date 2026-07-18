"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";

type AppChromeProps = {
  children: React.ReactNode;
};

export default function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);
  const prevPathname = useRef(pathname);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => clearTimeout(safetyTimer.current);
  }, []);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      clearTimeout(safetyTimer.current);
      setNavigating(false);
    }
  }, [pathname]);

  const handleNavigate = () => {
    setNavigating(true);
    clearTimeout(safetyTimer.current);
    safetyTimer.current = setTimeout(() => setNavigating(false), 5000);
  };

  const isPortalRoute = pathname.startsWith("/lms");

  return (
    <div className="site-shell">
      {isPortalRoute ? null : <Header onNavigate={handleNavigate} />}
      <main>
        {navigating ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <LoadingSpinner />
            <span className="ml-3 text-sm text-white/60">Loading…</span>
          </div>
        ) : (
          children
        )}
      </main>
      {isPortalRoute ? null : <Footer />}
    </div>
  );
}