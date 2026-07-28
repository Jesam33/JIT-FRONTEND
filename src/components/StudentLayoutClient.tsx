"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import StudentSidebar from "./StudentSidebar";
import StudentGuard from "./StudentGuard";
import LoadingSpinner from "./LoadingSpinner";
import LmsNavbar from "./LmsNavbar";

export default function StudentLayoutClient({ children }: { children: React.ReactNode }) {
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
    "/lms/login",
    "/lms/signup",
    "/lms/forgot-password",
    "/lms/reset-password",
    "/lms/setup-password",
    "/lms/invite",
  ];

  const hideSidebar = publicPaths.some((p) => pathname.startsWith(p));

  return (
    <StudentGuard>
      <div className="section-divider pt-6">
         <div className={`container-wide grid items-start gap-4 md:gap-6 ${hideSidebar ? "" : "lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]"}`}>
          {!hideSidebar && <StudentSidebar onNavigate={handleNavigate} />}
          <main className={`relative min-w-0 ${hideSidebar ? "" : "pb-8"}`}>
            {!hideSidebar && (
              <LmsNavbar
                portalName="Student Portal"
                bellHref="/lms/app/notifications"
                placeholder="Search lessons, tasks, or materials..."
                searchRedirectHref="/lms/app/materials"
              />
            )}
            {navigating ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <LoadingSpinner />
                <span className="ml-3 text-sm text-white/60">Loading…</span>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </StudentGuard>
  );
}
