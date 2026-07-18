"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import StaffSidebar from "./StaffSidebar";
import StaffGuard from "./StaffGuard";
import ErrorBoundary from "./ErrorBoundary";
import ToastProvider from "./ToastProvider";
import LoadingSpinner from "./LoadingSpinner";
import LmsNavbar from "./LmsNavbar";

export default function StaffLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
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

  const publicPaths = [
    "/lms/staff/login",
    "/lms/staff/forgot-password",
    "/lms/staff/reset-password",
  ];

  const hideSidebar = publicPaths.some((p) => pathname.startsWith(p));

  return (
    <StaffGuard>
      <ToastProvider>
      <div className="section-divider overflow-x-clip pt-6">
        <div className={`container-wide grid items-start gap-4 md:gap-6 ${hideSidebar ? "" : "lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]"}`}>
          {!hideSidebar && <StaffSidebar onNavigate={handleNavigate} />}
          <main className="relative min-w-0">
            {!hideSidebar && (
              <LmsNavbar
                portalName="Staff Portal"
                bellHref="/lms/staff/notifications"
                placeholder="Search students, courses, or resources..."
                searchRedirectHref="/lms/staff/students"
              />
            )}
            {navigating ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <LoadingSpinner />
                <span className="ml-3 text-sm text-white/60">Loading…</span>
              </div>
            ) : (
              <ErrorBoundary>{children}</ErrorBoundary>
            )}
          </main>
        </div>
      </div>
      </ToastProvider>
    </StaffGuard>
  );
}
