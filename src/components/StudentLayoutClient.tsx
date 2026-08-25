"use client";

import React from "react";
import { usePathname } from "next/navigation";
import StudentSidebar from "./StudentSidebar";
import StudentGuard from "./StudentGuard";
import LmsNavbar from "./LmsNavbar";
import DynamicFavicon from "./DynamicFavicon";
import { STUDENT_API, PUBLIC_API } from "@/lib/api";
import { brandingStyle, storefrontBackgroundStyle } from "@/lib/owner-branding";
import { usePortalBranding, isBranded } from "@/lib/use-portal-branding";
import { tenantLoginPath } from "@/lib/tenant-client";
import IdleLogout from "./IdleLogout";

export default function StudentLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const branding = usePortalBranding(STUDENT_API.branding, "lms_student_token", PUBLIC_API.branding);

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
      <DynamicFavicon href={branding?.logo_url ?? null} />
      {!hideSidebar && <IdleLogout tokenKeys={["lms_student_token"]} redirectTo={() => tenantLoginPath("student")} />}
      <div className="section-divider pt-6" style={{ ...brandingStyle(branding), ...storefrontBackgroundStyle(branding) }} data-branded={isBranded(branding) ? "" : undefined}>
         <div className={`container-wide grid items-start gap-4 md:gap-6 ${hideSidebar ? "" : "lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]"}`}>
          {!hideSidebar && <StudentSidebar />}
          <main className={`relative min-w-0 ${hideSidebar ? "" : "pb-8"}`}>
            {!hideSidebar && (
              <LmsNavbar
                portalName="Student Portal"
                bellHref="/lms/app/notifications"
                placeholder="Search lessons, tasks, or materials..."
                searchRedirectHref="/lms/app/materials"
                logoUrl={branding?.logo_url ?? null}
              />
            )}
            {children}
          </main>
        </div>
      </div>
    </StudentGuard>
  );
}
