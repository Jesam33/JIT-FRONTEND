"use client";

import { useEffect, useMemo, useState } from "react";
import InnerPageHero from "@/components/layout/InnerPageHero";
import { PUBLIC_API } from "@/lib/api";
import { tenantStorefrontUrl } from "@/lib/tenant-client";

// One academy in the Campuses directory. Only Pro-and-above academies are
// returned by the backend (see PublicInstituteController::campuses), so every
// card here is a paying, showcased customer academy.
type Campus = {
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  entity_label: string | null;
  description: string | null;
  course_titles: string[];
  course_count: number;
};

// The two initials we render inside the avatar when an academy has no logo —
// derived from its name so each circle still reads as that specific brand.
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function CampusesPage() {
  const [campuses, setCampuses] = useState<Campus[] | null>(null);
  const [error, setError] = useState(false);
  // The academy whose detail panel is open (null = the grid). Kept by slug so
  // it survives a re-fetch; resolved back to the object for rendering.
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(PUBLIC_API.campuses, { cache: "no-store" });
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        if (!cancelled) setCampuses(Array.isArray(data?.campuses) ? data.campuses : []);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openCampus = useMemo(
    () => (openSlug ? campuses?.find((c) => c.slug === openSlug) ?? null : null),
    [openSlug, campuses],
  );

  return (
    <section>
      <InnerPageHero
        title="Campus"
        subtitle="POWERED BY JORSAS TECH"
      >
        <p>
          Explore the academies built on our platform. Each campus below runs its own courses,
          instructors and community. Tap any campus to see what it teaches, then visit its site to
          enrol.
        </p>
      </InnerPageHero>

      <div className="container-wide py-14">
        {error ? (
          <div className="rounded-xl border border-site-border/30 bg-site-surface-soft p-8 text-center text-site-text/70">
            We couldn&apos;t load the campuses right now. Please try again shortly.
          </div>
        ) : campuses === null ? (
          // Skeleton avatars while the directory loads.
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className="h-28 w-28 animate-pulse rounded-full bg-white/10" />
                <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
              </div>
            ))}
          </div>
        ) : campuses.length === 0 ? (
          <div className="rounded-xl border border-site-border/30 bg-site-surface-soft p-10 text-center">
            <p className="text-lg font-semibold text-site-text">No campuses yet</p>
            <p className="mt-2 text-sm text-site-text/70">
              Pro academies appear here as they launch. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {campuses.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setOpenSlug(c.slug)}
                className="group flex flex-col items-center gap-3 text-center focus:outline-none"
              >
                <span
                  className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full ring-2 ring-white/15 transition group-hover:ring-site-primary group-focus-visible:ring-site-primary"
                  style={{ backgroundColor: c.primary_color ?? "#1a1a1a" }}
                >
                  {c.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.logo_url}
                      alt={c.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-white">{initials(c.name)}</span>
                  )}
                </span>
                <span className="text-sm font-semibold text-site-text transition group-hover:text-site-primary">
                  {c.name}
                </span>
                <span className="text-xs text-site-text/60">
                  {c.course_count} {c.course_count === 1 ? "course" : "courses"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Campus detail panel */}
      {openCampus ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpenSlug(null)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="animate-slide-up relative w-full max-w-lg rounded-t-2xl border border-site-border/30 bg-site-surface p-6 shadow-2xl sm:rounded-2xl">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpenSlug(null)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-site-border/40 text-site-text/70 transition hover:bg-white/10"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <div className="flex items-center gap-4">
              <span
                className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-white/15"
                style={{ backgroundColor: openCampus.primary_color ?? "#1a1a1a" }}
              >
                {openCampus.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={openCampus.logo_url} alt={openCampus.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-white">{initials(openCampus.name)}</span>
                )}
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-xl font-bold text-site-text">{openCampus.name}</h3>
                <p className="text-xs uppercase tracking-wider text-site-text/50">
                  {openCampus.entity_label ?? "Online Academy"}
                </p>
              </div>
            </div>

            {openCampus.description ? (
              <p className="mt-4 text-sm leading-relaxed text-site-text/75">{openCampus.description}</p>
            ) : null}

            {openCampus.course_titles.length > 0 ? (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-site-text/50">
                  Courses
                </p>
                <ul className="flex flex-wrap gap-2">
                  {openCampus.course_titles.map((title) => (
                    <li
                      key={title}
                      className="rounded-full border border-site-border/30 bg-site-surface-soft px-3 py-1 text-xs text-site-text/80"
                    >
                      {title}
                    </li>
                  ))}
                  {openCampus.course_count > openCampus.course_titles.length ? (
                    <li className="rounded-full border border-site-border/30 px-3 py-1 text-xs text-site-text/50">
                      +{openCampus.course_count - openCampus.course_titles.length} more
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : (
              <p className="mt-5 text-sm text-site-text/60">No published courses yet.</p>
            )}

            <a
              href={tenantStorefrontUrl(openCampus.slug)}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 no-underline"
              style={{ backgroundColor: openCampus.primary_color ?? "var(--color-primary)" }}
            >
              Visit {openCampus.name}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      ) : null}
    </section>
  );
}
