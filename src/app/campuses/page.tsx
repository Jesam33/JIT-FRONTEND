"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  niche: string | null;
  course_titles: string[];
  course_count: number;
};

// Category-chip row scaling: up to this many niches the filter renders as a
// plain row of chips (best for scanning a small set, one tap, nothing hidden).
// Beyond it the row becomes a searchable dropdown instead, so a platform with
// hundreds of distinct niches never floods the page with pills. The dropdown's
// own search box appears once the list passes SEARCHABLE_NICHE_CHIPS.
const VISIBLE_NICHE_CHIPS = 8;
const SEARCHABLE_NICHE_CHIPS = 24;

// The two initials we render inside the avatar when an academy has no logo, 
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
  // The selected category filter (null = All). Only categories actually present
  // are offered, so a selection always matches at least one academy.
  const [activeNiche, setActiveNiche] = useState<string | null>(null);
  // The main directory search: live-filters the GRID (not the category list) as
  // the visitor types, matching academy names, their course titles, and category.
  // This is the page's primary discovery control; the category chips/dropdown is
  // the facet filter beside it.
  const [query, setQuery] = useState("");

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

  // Distinct categories present across the loaded academies, sorted, so the
  // filter row only ever offers niches that actually match an academy.
  const niches = useMemo(() => {
    if (!campuses) return [];
    const set = new Set<string>();
    for (const c of campuses) {
      const n = (c.niche ?? "").trim();
      if (n) set.add(n);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [campuses]);

  // A small set renders as chips; a big set becomes a dropdown.
  const manyNiches = niches.length > VISIBLE_NICHE_CHIPS;

  // The grid after the category facet + the search query (either can be empty).
  // The query matches an academy's name, its course titles, or its category, so
  // typing a category name works too without needing to open the dropdown.
  const filtered = useMemo(() => {
    if (!campuses) return [];
    let list = campuses;
    if (activeNiche) {
      list = list.filter((c) => (c.niche ?? "").trim() === activeNiche);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.niche ?? "").toLowerCase().includes(q) ||
          c.course_titles.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [campuses, activeNiche, query]);

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
          <>
            {/* Search + category facet, one row. The search box is the primary
                discovery control and live-filters the grid as the visitor types
                (it matches academy names, their course titles, and category, so
                typing a category name works too). The category control beside it
                narrows by facet: a small list renders as chips, a long list
                becomes a dropdown (with its own search once huge). Either can be
                used alone, or both together. */}
            <div className="mb-8 flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-auto sm:min-w-[240px] sm:max-w-sm sm:flex-1">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-site-text/40"
                >
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search academies or courses…"
                  aria-label="Search academies"
                  className="w-full rounded-full border border-site-border/40 bg-site-surface-soft py-1.5 pl-10 pr-4 text-sm text-site-text outline-none transition placeholder:text-site-text/40 focus:border-site-primary/60"
                />
              </div>
              {niches.length > 0 ? (
                manyNiches ? (
                  <NicheDropdown niches={niches} active={activeNiche} onSelect={setActiveNiche} />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <FilterChip active={activeNiche === null} onClick={() => setActiveNiche(null)}>
                      All
                    </FilterChip>
                    {niches.map((n) => (
                      <FilterChip key={n} active={activeNiche === n} onClick={() => setActiveNiche(n)}>
                        {n}
                      </FilterChip>
                    ))}
                  </div>
                )
              ) : null}
            </div>

            {filtered.length === 0 ? (
              // Some academies exist but the current search + category combo
              // matches none. Distinct from the "No campuses yet" case above.
              <div className="rounded-xl border border-site-border/30 bg-site-surface-soft p-10 text-center">
                <p className="text-lg font-semibold text-site-text">No matching academies</p>
                <p className="mt-2 text-sm text-site-text/70">
                  Nothing matches your search or category. Try a different word, or clear the
                  filters to see every campus.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setActiveNiche(null);
                  }}
                  className="mt-4 rounded-full border border-site-border/40 bg-site-surface px-5 py-2 text-sm font-semibold text-site-text/80 transition hover:bg-white/10"
                >
                  Clear search and filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((c) => (
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
          </>
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

// One pill in the category filter row. Filled with the brand primary when active.
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "border-site-primary bg-site-primary text-white"
          : "border-site-border/40 bg-site-surface-soft text-site-text/70 hover:border-site-primary/60 hover:text-site-text"
      }`}
    >
      {children}
    </button>
  );
}

// The category filter for LONG niche lists: a pill-shaped trigger that opens a
// panel with (optionally) a name search and a scrollable list. Used instead of
// the chip row once there are more niches than comfortably fit, so hundreds of
// categories stay one click + a keystroke away instead of flooding the page.
// A native <select> was considered and rejected: it can't carry the search box
// reliably across platforms and wouldn't match the site's pill styling.
function NicheDropdown({
  niches,
  active,
  onSelect,
}: {
  niches: string[];
  active: string | null;
  onSelect: (niche: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const searchable = niches.length > SEARCHABLE_NICHE_CHIPS;

  // Close on outside click / Escape while open. The mousedown listener is on
  // document so a click on the backdrop or anywhere else on the page dismisses.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Focus the search as soon as the panel opens with one, so typing narrows
  // immediately (the whole point of the dropdown at this scale).
  useEffect(() => {
    if (open && searchable) searchRef.current?.focus();
  }, [open, searchable]);

  const q = query.trim().toLowerCase();
  const list = q ? niches.filter((n) => n.toLowerCase().includes(q)) : niches;

  const pick = (n: string | null) => {
    onSelect(n);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="relative inline-block" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
          active
            ? "border-site-primary bg-site-primary text-white"
            : "border-site-border/40 bg-site-surface-soft text-site-text/70 hover:border-site-primary/60 hover:text-site-text"
        }`}
      >
        {active ?? "All categories"}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div className="absolute left-0 z-30 mt-2 w-72 rounded-xl border border-site-border/40 bg-site-surface p-2 shadow-2xl">
          {searchable ? (
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories…"
              aria-label="Search categories"
              className="mb-2 w-full rounded-lg border border-site-border/40 bg-site-surface-soft px-3 py-2 text-sm text-site-text outline-none transition placeholder:text-site-text/40 focus:border-site-primary/60"
            />
          ) : null}
          <div role="listbox" aria-label="Categories" className="max-h-72 overflow-y-auto">
            <DropdownRow active={!active} onClick={() => pick(null)}>
              All categories
            </DropdownRow>
            {list.map((n) => (
              <DropdownRow key={n} active={active === n} onClick={() => pick(n)}>
                {n}
              </DropdownRow>
            ))}
            {list.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-site-text/50">No matching category.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DropdownRow({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
        active
          ? "bg-site-primary/15 font-semibold text-site-text"
          : "text-site-text/75 hover:bg-white/5 hover:text-site-text"
      }`}
    >
      {children}
      {active ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-site-primary">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </button>
  );
}
