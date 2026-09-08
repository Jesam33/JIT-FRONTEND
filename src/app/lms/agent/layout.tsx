"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AgentContextProvider } from "../../../components/AgentContext";
import AgentSidebar from "../../../components/AgentSidebar";
import LmsNavbar from "../../../components/LmsNavbar";
import type { NavbarSearchItem } from "../../../components/NavbarSearch";
import ToastProvider from "../../../components/ToastProvider";
import ErrorBoundary from "../../../components/ErrorBoundary";
import IdleLogout from "../../../components/IdleLogout";
import { AGENT_API } from "../../../lib/api";
import { fetchWithTimeout, okJson } from "../../../lib/fetch-with-timeout";

// The navbar search's live index for agents: their registered students (the
// registrations list) and the courses they can register students for. Loaded
// lazily on first search from the same endpoints the pages use, then cached in
// the navbar for the session. allSettled isolates each source.
type SearchRegistration = { id: number; name: string; email: string; course?: string };
type SearchCourse = { id: number; title: string };

async function loadAgentSearchIndex(): Promise<NavbarSearchItem[]> {
  const token = typeof window !== "undefined" ? localStorage.getItem("lms_agent_token") : null;
  if (!token) return [];
  const headers = { Authorization: `Bearer ${token}` };

  const [registrationsR, coursesR] = await Promise.allSettled([
    // The endpoint answers either a bare array or { data: [...] } (the
    // registrations page accepts both shapes).
    fetchWithTimeout(AGENT_API.registrations, { headers })
      .then((r) => okJson<SearchRegistration[] | { data?: SearchRegistration[] }>(r)),
    fetchWithTimeout(AGENT_API.courses, { headers })
      .then((r) => okJson<SearchCourse[]>(r)),
  ]);

  const items: NavbarSearchItem[] = [];

  if (registrationsR.status === "fulfilled") {
    const raw = registrationsR.value;
    const regs = Array.isArray(raw) ? raw : raw.data ?? [];
    for (const r of regs) {
      items.push({
        key: `registration-${r.id}`,
        group: "Students",
        title: r.name,
        subtitle: r.course,
        searchText: `${r.name} ${r.email} ${r.course ?? ""}`.toLowerCase(),
        // The registrations page seeds its own search box from ?search= and
        // matches name OR email; email is the unique one.
        href: `/lms/agent/registrations?search=${encodeURIComponent(r.email || r.name)}`,
      });
    }
  }

  if (coursesR.status === "fulfilled") {
    for (const c of Array.isArray(coursesR.value) ? coursesR.value : []) {
      items.push({
        key: `course-${c.id}`,
        group: "Courses",
        title: c.title,
        searchText: (c.title ?? "").toLowerCase(),
        // An agent's only per-course action is registering a student for it.
        href: "/lms/agent/register-student",
      });
    }
  }

  return items;
}

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  const publicPaths = ["/lms/agent/login", "/lms/agent/forgot-password", "/lms/agent/reset-password"];
  const isPublicPage = publicPaths.includes(pathname);

  useEffect(() => {
    if (isPublicPage) { setReady(true); return; }
    const token = localStorage.getItem("lms_agent_token");
    if (!token) { router.replace("/lms/agent/login"); return; }
    setReady(true);
  }, [router, isPublicPage]);

  if (!ready) return null;
  if (isPublicPage) return <>{children}</>;

  return (
    <AgentContextProvider>
      <ToastProvider>
        <IdleLogout tokenKeys={["lms_agent_token"]} redirectTo="/lms/agent/login" />
        <div className="section-divider pt-6">
          <div className="container-wide grid items-start gap-4 md:gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
            <AgentSidebar />
            <main className="relative min-w-0 pb-8">
              <LmsNavbar
                portalName="Admission Marketer Portal"
                bellHref="/lms/agent/notifications"
                placeholder="Search your students..."
                searchRedirectHref="/lms/agent/registrations"
                loadSearchItems={loadAgentSearchIndex}
              />
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
          </div>
        </div>
      </ToastProvider>
    </AgentContextProvider>
  );
}
