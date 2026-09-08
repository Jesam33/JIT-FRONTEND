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
import { apiFetchStaff, okJson } from "@/lib/fetch-with-timeout";
import type { NavbarSearchItem } from "@/components/NavbarSearch";
import { brandingStyle, storefrontBackgroundStyle } from "@/lib/owner-branding";
import { usePortalBranding, isBranded } from "@/lib/use-portal-branding";
import { tenantLoginPath, pinTenantFromLocation } from "@/lib/tenant-client";
import IdleLogout from "./IdleLogout";

// The navbar search's live index for staff: their assigned students, courses,
// tracks, tasks, and materials. Loaded lazily on first search (never on page
// load) from the lightweight list endpoints the portal pages already use, then
// cached in the navbar for the session. allSettled isolates each source, so
// one failing endpoint just shrinks the index. apiFetchStaff injects the
// staff token.
type SearchStudent = { id: number; first_name?: string; last_name?: string; email?: string };
type SearchCourse = { id: number; title: string; description?: string };
type SearchTrack = { id: number; name: string };
type SearchTask = { id: number; title: string; description?: string };
type SearchMaterial = { id: number; title: string; type?: string };

async function loadStaffSearchIndex(): Promise<NavbarSearchItem[]> {
  const [studentsR, coursesR, tracksR, tasksR, materialsR] = await Promise.allSettled([
    apiFetchStaff(STAFF_API.students).then((r) => okJson<SearchStudent[]>(r)),
    apiFetchStaff(STAFF_API.assignedCourses).then((r) => okJson<SearchCourse[]>(r)),
    apiFetchStaff(STAFF_API.assignedTracks).then((r) => okJson<SearchTrack[]>(r)),
    apiFetchStaff(STAFF_API.tasks).then((r) => okJson<SearchTask[]>(r)),
    apiFetchStaff(STAFF_API.materials).then((r) => okJson<SearchMaterial[]>(r)),
  ]);

  const items: NavbarSearchItem[] = [];

  if (studentsR.status === "fulfilled") {
    for (const s of Array.isArray(studentsR.value) ? studentsR.value : []) {
      const name = [s.first_name, s.last_name].filter(Boolean).join(" ");
      items.push({
        key: `student-${s.id}`,
        group: "Students",
        title: name || s.email || `Student #${s.id}`,
        subtitle: s.email,
        searchText: `${name} ${s.email ?? ""}`.toLowerCase(),
        // The students page filters client-side from ?search= (name OR email);
        // email is the unique one.
        href: `/lms/staff/students?search=${encodeURIComponent(s.email ?? name)}`,
      });
    }
  }

  // The remaining groups have no per-item detail page in the staff portal, so
  // selecting one navigates to its management page; the match itself confirms
  // the thing exists and is assigned to this staff member.
  if (coursesR.status === "fulfilled") {
    for (const c of Array.isArray(coursesR.value) ? coursesR.value : []) {
      items.push({
        key: `course-${c.id}`,
        group: "Courses",
        title: c.title,
        searchText: `${c.title} ${c.description ?? ""}`.toLowerCase(),
        href: "/lms/staff/courses",
      });
    }
  }

  if (tracksR.status === "fulfilled") {
    for (const t of Array.isArray(tracksR.value) ? tracksR.value : []) {
      items.push({
        key: `track-${t.id}`,
        group: "Tracks",
        title: t.name,
        searchText: (t.name ?? "").toLowerCase(),
        href: "/lms/staff/tracks",
      });
    }
  }

  if (tasksR.status === "fulfilled") {
    for (const t of Array.isArray(tasksR.value) ? tasksR.value : []) {
      items.push({
        key: `task-${t.id}`,
        group: "Tasks",
        title: t.title,
        searchText: `${t.title} ${t.description ?? ""}`.toLowerCase(),
        href: "/lms/staff/tasks",
      });
    }
  }

  if (materialsR.status === "fulfilled") {
    for (const m of Array.isArray(materialsR.value) ? materialsR.value : []) {
      items.push({
        key: `material-${m.id}`,
        group: "Materials",
        title: m.title,
        subtitle: m.type ? m.type.toUpperCase() : undefined,
        searchText: (m.title ?? "").toLowerCase(),
        href: "/lms/staff/materials",
      });
    }
  }

  return items;
}

export default function StaffLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const branding = usePortalBranding(STAFF_API.branding, "lms_staff_token", PUBLIC_API.branding);

  // Pin the institute from an emailed link's ?tenant= so invite/reset → login
  // stays on the right portal instead of defaulting to the primary slug.
  useEffect(() => {
    pinTenantFromLocation();
  }, [pathname]);

  // Title the browser tab with the academy, not the inherited "Staff Portal",
  // on a NON-primary institute (mirrors DynamicFavicon's guard + the owner /
  // public-storefront shells). The static layout metadata ships "Staff Portal";
  // this post-hydration write lands last and holds once branding resolves.
  useEffect(() => {
    const name = branding?.name?.trim();
    // Gate on the backend's authoritative is_primary, NOT the tenant cookie: on
    // this bare /lms/staff/app URL the cookie falls back to the primary slug, so
    // a slug check would wrongly skip the swap on a real academy.
    if (name && branding && branding.is_primary === false) {
      document.title = name;
    }
  }, [branding]);

  const publicPaths = [
    "/lms/staff/login",
    "/lms/staff/forgot-password",
    "/lms/staff/reset-password",
    "/lms/staff/setup-password",
  ];

  const hideSidebar = publicPaths.some((p) => pathname.startsWith(p));

  // Every staff auth screen (login, forgot/reset/setup password) now uses the
  // shared neutral <AuthLayout>, which owns the whole viewport (its own logo,
  // branding + favicon). Render them all chrome-free, no sidebar shell, no
  // extra glow container, no second <main>, so they read as clean full-screen
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
      <DynamicFavicon
        href={branding?.logo_url ?? null}
        fallbackColor={branding?.primary_color ?? null}
        isPrimary={branding?.is_primary ?? null}
        markText={branding?.name ?? null}
      />
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
                loadSearchItems={loadStaffSearchIndex}
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
