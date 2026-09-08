"use client";

import React from "react";
import { usePathname } from "next/navigation";
import StudentSidebar from "./StudentSidebar";
import StudentGuard from "./StudentGuard";
import LmsNavbar from "./LmsNavbar";
import DynamicFavicon from "./DynamicFavicon";
import { STUDENT_API, STUDENT_MODULE_API, PUBLIC_API } from "@/lib/api";
import { apiFetch, okJson } from "@/lib/fetch-with-timeout";
import type { NavbarSearchItem } from "@/components/NavbarSearch";
import { brandingStyle, storefrontBackgroundStyle } from "@/lib/owner-branding";
import { usePortalBranding, isBranded } from "@/lib/use-portal-branding";
import { tenantLoginPath, pinTenantFromLocation } from "@/lib/tenant-client";
import IdleLogout from "./IdleLogout";

// The navbar search's live index: this student's own modules, tasks, and
// materials. Fetched lazily (only when they actually type in the search box)
// from the three lightweight list endpoints, never the heavy dashboard one,
// then cached in the navbar for the rest of the portal session. Each source is
// isolated with allSettled, so one failing endpoint just shrinks the index
// instead of killing search. apiFetch injects the student token.
type SearchModule = { id: number; title: string; description?: string | null; contents?: { title: string }[] };
type SearchTask = { id: number; title: string; description?: string | null; instructions?: string | null; status?: string };
type SearchMaterial = { id: number; title: string; type?: string | null };

async function loadStudentSearchIndex(): Promise<NavbarSearchItem[]> {
  const [modulesR, tasksR, materialsR] = await Promise.allSettled([
    apiFetch(STUDENT_MODULE_API.modules).then((r) => okJson<SearchModule[]>(r)),
    apiFetch(STUDENT_API.tasks).then((r) => okJson<SearchTask[]>(r)),
    apiFetch(STUDENT_API.materials).then((r) => okJson<SearchMaterial[]>(r)),
  ]);

  const items: NavbarSearchItem[] = [];

  if (modulesR.status === "fulfilled") {
    for (const m of Array.isArray(modulesR.value) ? modulesR.value : []) {
      items.push({
        key: `module-${m.id}`,
        group: "Modules",
        title: m.title,
        // Match the module's own text plus its content titles, so searching a
        // lesson's name finds the module that contains it.
        searchText: [m.title, m.description, ...(m.contents ?? []).map((c) => c.title)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
        subtitle: m.contents?.length ? `${m.contents.length} items` : undefined,
        href: `/lms/app/modules/${m.id}`,
      });
    }
  }

  if (tasksR.status === "fulfilled") {
    for (const t of Array.isArray(tasksR.value) ? tasksR.value : []) {
      items.push({
        key: `task-${t.id}`,
        group: "Tasks",
        title: t.title,
        searchText: [t.title, t.description, t.instructions].filter(Boolean).join(" ").toLowerCase(),
        subtitle: t.status ? t.status.charAt(0).toUpperCase() + t.status.slice(1) : undefined,
        href: `/lms/tasks/${t.id}`,
      });
    }
  }

  if (materialsR.status === "fulfilled") {
    for (const m of Array.isArray(materialsR.value) ? materialsR.value : []) {
      items.push({
        key: `material-${m.id}`,
        group: "Materials",
        title: m.title,
        searchText: (m.title ?? "").toLowerCase(),
        subtitle: m.type ? m.type.toUpperCase() : undefined,
        // Materials have no detail page; land on the materials list filtered
        // to this title.
        href: `/lms/app/materials?search=${encodeURIComponent(m.title ?? "")}`,
      });
    }
  }

  return items;
}

export default function StudentLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const branding = usePortalBranding(STUDENT_API.branding, "lms_student_token", PUBLIC_API.branding);

  // Pin the institute from an emailed link's ?tenant= so branding + the whole
  // session stay on the right portal (parity with StaffLayoutClient), instead of
  // defaulting to the primary slug on a deep-linked visit.
  React.useEffect(() => {
    pinTenantFromLocation();
  }, [pathname]);

  // Title the browser tab with the academy, not the inherited "Student Portal",
  // on a NON-primary institute. Gate on the backend's authoritative is_primary,
  // NOT the tenant cookie: on a bare /lms/app URL the cookie falls back to the
  // primary slug, so a slug check would wrongly skip the swap on a real academy.
  React.useEffect(() => {
    const name = branding?.name?.trim();
    if (name && branding && branding.is_primary === false) {
      document.title = name;
    }
  }, [branding]);

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
      <DynamicFavicon
        href={branding?.logo_url ?? null}
        fallbackColor={branding?.primary_color ?? null}
        isPrimary={branding?.is_primary ?? null}
        markText={branding?.name ?? null}
      />
      {!hideSidebar && <IdleLogout tokenKeys={["lms_student_token"]} redirectTo={() => tenantLoginPath("student")} />}
      <div className="section-divider pt-6" style={{ ...brandingStyle(branding), ...storefrontBackgroundStyle(branding) }} data-branded={isBranded(branding) ? "" : undefined}>
         <div className={`container-wide grid items-start gap-4 md:gap-6 ${hideSidebar ? "" : "lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]"}`}>
          {!hideSidebar && <StudentSidebar />}
          <main className={`relative min-w-0 ${hideSidebar ? "" : "pb-8"}`}>
            {!hideSidebar && (
              <LmsNavbar
                portalName="Student Portal"
                bellHref="/lms/app/notifications"
                placeholder="Search modules, tasks, or materials..."
                searchRedirectHref="/lms/app/materials"
                loadSearchItems={loadStudentSearchIndex}
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
