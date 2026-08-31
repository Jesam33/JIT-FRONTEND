"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import StaffSidebar from "./StaffSidebar";
import StaffGuard from "./StaffGuard";
import ErrorBoundary from "./ErrorBoundary";
import ToastProvider from "./ToastProvider";
import LmsNavbar from "./LmsNavbar";
import DynamicFavicon from "./DynamicFavicon";
import { STAFF_API, PUBLIC_API } from "@/lib/api";
import { brandingStyle, storefrontBackgroundStyle } from "@/lib/owner-branding";
import { usePortalBranding, isBranded } from "@/lib/use-portal-branding";
import { tenantLoginPath, pinTenantFromLocation } from "@/lib/tenant-client";
import IdleLogout from "./IdleLogout";

export default function StaffLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const branding = usePortalBranding(STAFF_API.branding, "lms_staff_token", PUBLIC_API.branding);

  // Pin the institute from an emailed link's ?tenant= so invite/reset → login
  // stays on the right portal instead of defaulting to the primary slug.
  useEffect(() => {
    pinTenantFromLocation();
  }, [pathname]);

  const publicPaths = [
    "/lms/staff/login",
    "/lms/staff/forgot-password",
    "/lms/staff/reset-password",
    "/lms/staff/setup-password",
  ];

  const hideSidebar = publicPaths.some((p) => pathname.startsWith(p));

  // Every staff auth screen (login, forgot/reset/setup password) now uses the
  // shared neutral <AuthLayout>, which owns the whole viewport (its own logo,
  // branding + favicon). Render them all chrome-free — no sidebar shell, no
  // extra glow container, no second <main> — so they read as clean full-screen
  // pages like the owner login, instead of sitting in a constrained panel.
  if (hideSidebar) {
    return (
      <StaffGuard>
        <ToastProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </ToastProvider>
      </StaffGuard>
    );
  }

  return (
    <StaffGuard>
      <ToastProvider>
      <DynamicFavicon href={branding?.logo_url ?? null} />
      {!hideSidebar && <IdleLogout tokenKeys={["lms_staff_token"]} redirectTo={() => tenantLoginPath("staff")} />}
      <div className="section-divider pt-6" style={{ ...brandingStyle(branding), ...storefrontBackgroundStyle(branding) }} data-branded={isBranded(branding) ? "" : undefined}>
        <div className={`container-wide grid items-start gap-4 md:gap-6 ${hideSidebar ? "" : "lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]"}`}>
          {!hideSidebar && <StaffSidebar />}
          <main className={`relative min-w-0 ${hideSidebar ? "" : "pb-8"}`}>
            {!hideSidebar && (
              <LmsNavbar
                portalName="Staff Portal"
                bellHref="/lms/staff/notifications"
                placeholder="Search students, courses, or resources..."
                searchRedirectHref="/lms/staff/students"
                logoUrl={branding?.logo_url ?? null}
              />
            )}
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </div>
      </div>
      </ToastProvider>
    </StaffGuard>
  );
}
