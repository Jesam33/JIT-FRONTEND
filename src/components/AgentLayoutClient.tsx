"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AgentContextProvider } from "./AgentContext";
import AgentSidebar from "./AgentSidebar";
import LmsNavbar from "./LmsNavbar";
import type { NavbarSearchItem } from "./NavbarSearch";
import ToastProvider from "./ToastProvider";
import ErrorBoundary from "./ErrorBoundary";
import IdleLogout from "./IdleLogout";
import DynamicFavicon from "./DynamicFavicon";
import AppInstallPrompt from "./AppInstallPrompt";
import AcademyOfflineBanner from "./AcademyOfflineBanner";
import FeedbackButton, { type FeedbackSubmission } from "./FeedbackButton";
import { AGENT_API, PUBLIC_API, FEEDBACK_API } from "@/lib/api";
import { fetchWithTimeout, okJson } from "@/lib/fetch-with-timeout";
import { brandingStyle, storefrontBackgroundStyle } from "@/lib/owner-branding";
import { usePortalBranding, isBranded } from "@/lib/use-portal-branding";
import { pinTenantFromLocation } from "@/lib/tenant-client";

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

// The agent portal shell: chrome + white-label branding, mirroring
// StaffLayoutClient/StudentLayoutClient. An Admission Marketer works FOR one
// academy, so their portal wears that academy's identity (logo in the navbar,
// accent colour, favicon and browser tab), never the platform's.
export default function AgentLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [ready, setReady] = useState(false);

  // Portal-agnostic branding endpoint; the tenant resolves from the agent's own
  // bearer session (ResolveTenantFromSession reads AgentSession too), so this
  // returns the academy the agent belongs to, not the primary palette.
  const branding = usePortalBranding(AGENT_API.branding, "lms_agent_token", PUBLIC_API.branding);

  // Pin the institute from an emailed link's ?tenant= so a deep-linked visit
  // (agent invite, reset link) stays on the right academy instead of defaulting
  // to the primary slug.
  useEffect(() => {
    pinTenantFromLocation();
  }, [pathname]);

  // Title the browser tab with the academy on a NON-primary institute. Without
  // this the agent portal inherits the root layout's "Jorsas Tech" title, which
  // is exactly what an agent of another academy should never see. Gated on the
  // backend's authoritative is_primary, NOT the tenant cookie (on a bare
  // /lms/agent URL the cookie falls back to the primary slug).
  useEffect(() => {
    const name = branding?.name?.trim();
    if (name && branding && branding.is_primary === false) {
      document.title = name;
    }
  }, [branding]);

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

  // "Help us make the app better". The agent's own bearer token is what the
  // backend reads the author and academy from, so the payload carries neither.
  // `tone="surface"` because this portal is themed with the site tokens rather
  // than the dark chrome the other three use.
  const submitFeedback = async (payload: FeedbackSubmission) => {
    const token = localStorage.getItem("lms_agent_token");
    const res = await fetchWithTimeout(FEEDBACK_API.submit, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Feedback was not accepted.");
  };

  return (
    <AgentContextProvider>
      <ToastProvider>
        <DynamicFavicon
          href={branding?.logo_url ?? null}
          fallbackColor={branding?.primary_color ?? null}
          isPrimary={branding?.is_primary ?? null}
          markText={branding?.name ?? null}
        />
        <IdleLogout tokenKeys={["lms_agent_token"]} redirectTo="/lms/agent/login" />
        {/* Offer the per-academy app install. The auth screens returned above
            before this point, so the prompt is a logged-in affordance by
            construction. role="agent" makes the installed app open
            /lms/agent/dashboard, and a distinct manifest `id`, so an agent who
            is also a student at the same academy gets two separate installs. */}
        <AppInstallPrompt role="agent" name={branding?.name ?? null} logoUrl={branding?.logo_url ?? null} />
        <FeedbackButton submit={submitFeedback} tone="surface" />
        <div
          className="section-divider pt-6"
          style={{ ...brandingStyle(branding), ...storefrontBackgroundStyle(branding) }}
          data-branded={isBranded(branding) ? "" : undefined}
        >
          {/* grid-cols-1 pins the phone column to the screen width (see OwnerLayoutClient). */}
          <div className="container-wide grid grid-cols-1 items-start [&>*]:min-w-0 gap-4 md:gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
            <AgentSidebar />
            <main className="relative min-w-0 pb-8">
              <LmsNavbar
                portalName="Admission Marketer Portal"
                bellHref="/lms/agent/notifications"
                placeholder="Search your students..."
                searchRedirectHref="/lms/agent/registrations"
                loadSearchItems={loadAgentSearchIndex}
                logoUrl={branding?.logo_url ?? null}
              />
              {/* The owner's offline switch refuses registerStudent, so the
                  agent would otherwise only find out by filling the form and
                  being rejected. */}
              <AcademyOfflineBanner accepting={branding?.academy_accepting} name={branding?.name} audience="agent" />
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
          </div>
        </div>
      </ToastProvider>
    </AgentContextProvider>
  );
}
