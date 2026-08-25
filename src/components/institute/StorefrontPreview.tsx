"use client";

import { useEffect, useMemo, useState } from "react";
import InstituteHeader from "@/components/institute/InstituteHeader";
import InstituteSiteFooter from "@/components/institute/InstituteSiteFooter";
import InstituteStorefront, { type StorefrontCourse, type StorefrontData } from "@/components/institute/InstituteStorefront";
import { brandingStyle, storefrontBackgroundStyle, DEFAULT_BRANDING, type OwnerBranding } from "@/lib/owner-branding";
import { hasContactInfo, type InstituteProfile } from "@/lib/institute-profile";
import { PUBLIC_API } from "@/lib/api";

// A live, in-editor preview of an institute's REAL public page (/i/{slug}).
//
// It renders the exact same tree as app/i/[slug]/layout.tsx + page.tsx —
// brandingStyle + storefrontBackgroundStyle wrapper, InstituteHeader, the
// storefront (hero logo hidden, since the header already carries the logo), and
// the slim site footer — so what an owner sees here is what visitors get.
//
// The difference is the DATA source: instead of the saved storefront, it takes
// the owner's *unsaved* edits as overrides (brandingOverride on the Customization
// page, profileOverride on the Public-page editor) and layers them over the
// institute's currently-published storefront (fetched once for real courses +
// whichever half isn't being edited). That's what lets colors/font/cover/copy
// update live as the owner types, before they hit Save.
//
// The whole rendered page is pointer-events-none/select-none — it's a picture,
// not a working page (clicks, the theme toggle, and links are all inert); only
// the frame's "Open ↗" link is live. Scrolling still works: wheel/touch events
// fall through to the scrollable frame.

// Shown when the institute hasn't published any courses yet, so the preview
// still reads as a real, populated page rather than an empty grid.
const SAMPLE_COURSES: StorefrontCourse[] = [
  {
    id: -1,
    slug: "sample-live",
    title: "Full-Stack Web Development",
    description: "A hands-on program covering frontend and backend — from fundamentals to deploying a real app.",
    price: 150000,
    max_students: 30,
    registered_count: 12,
    slots_remaining: 18,
    is_full: false,
    is_live_available: true,
    is_prerecorded_available: true,
  },
  {
    id: -2,
    slug: "sample-recorded",
    title: "Data Analytics Foundations",
    description: "Turn raw data into decisions with spreadsheets, SQL, and clear visualisation.",
    price: 0,
    max_students: 0,
    registered_count: 0,
    slots_remaining: 0,
    is_full: false,
    is_live_available: false,
    is_prerecorded_available: true,
  },
];

type StorefrontPreviewProps = {
  slug: string | null;
  instituteName?: string | null;
  // Unsaved edits to layer over the published storefront. Pass whichever half
  // this editor changes; the other half falls back to the published values.
  brandingOverride?: OwnerBranding;
  profileOverride?: InstituteProfile;
  className?: string;
};

export default function StorefrontPreview({
  slug,
  instituteName,
  brandingOverride,
  profileOverride,
  className,
}: StorefrontPreviewProps) {
  const [base, setBase] = useState<StorefrontData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!slug) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    setLoaded(false);
    fetch(PUBLIC_API.storefront(slug))
      .then((r) => (r.ok ? r.json() : null))
      .then((j: StorefrontData | null) => {
        if (!cancelled) setBase(j);
      })
      .catch(() => {
        if (!cancelled) setBase(null);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Effective data: the edited half wins; the rest comes from the published
  // storefront (or a sensible default when it can't be fetched).
  const branding: OwnerBranding = brandingOverride ?? base?.branding ?? DEFAULT_BRANDING;
  const profile: InstituteProfile | undefined = profileOverride ?? base?.profile ?? undefined;
  const name = (instituteName || base?.institute?.name || "Your institute").trim();
  const previewSlug = slug || base?.institute?.slug || "preview";

  const realCourses = base?.courses ?? [];
  const usingSample = loaded && realCourses.length === 0;
  const courses = usingSample ? SAMPLE_COURSES : realCourses;

  const institute = useMemo(() => ({ name, slug: previewSlug }), [name, previewSlug]);
  const wrapperStyle = useMemo(
    () => ({ ...brandingStyle(branding), ...storefrontBackgroundStyle(branding) }),
    [branding],
  );

  return (
    <div className={`overflow-hidden rounded-2xl border border-white/15 bg-[#0b0b0b] shadow-[0_20px_60px_rgba(0,0,0,0.4)] ${className ?? ""}`}>
      {/* Fake browser chrome so the preview reads as "your page in a window". */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-red-400/70" aria-hidden="true" />
        <span className="h-3 w-3 rounded-full bg-amber-400/70" aria-hidden="true" />
        <span className="h-3 w-3 rounded-full bg-emerald-400/70" aria-hidden="true" />
        <div className="ml-2 flex-1 truncate rounded-md bg-black/40 px-3 py-1 text-[11px] text-white/45">
          {slug ? `${origin ? origin.replace(/^https?:\/\//, "") : ""}/i/${slug}` : "Your public page"}
        </div>
        {slug ? (
          <a
            href={`/i/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-md border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/70 transition hover:bg-white/10"
          >
            Open ↗
          </a>
        ) : null}
      </div>

      {/* The page itself — scrollable, inert. storefrontBackgroundStyle paints
          the institute's ambient glow behind it, exactly like the live layout. */}
      <div className="max-h-[600px] overflow-y-auto overflow-x-hidden">
        <div style={wrapperStyle}>
          <div className="pointer-events-none select-none">
            <InstituteHeader
              institute={institute}
              branding={branding}
              hrefBase={`/i/${previewSlug}`}
              showContact={hasContactInfo(profile)}
            />
            <InstituteStorefront
              institute={institute}
              branding={branding}
              profile={profile}
              courses={courses}
              hrefBase="#"
              showHeroLogo={false}
            />
            <InstituteSiteFooter institute={institute} />
          </div>
        </div>
      </div>

      {usingSample ? (
        <p className="border-t border-white/10 bg-white/[0.02] px-4 py-2 text-[11px] text-white/40">
          Showing sample courses — your own courses appear here once you publish them.
        </p>
      ) : null}
    </div>
  );
}
