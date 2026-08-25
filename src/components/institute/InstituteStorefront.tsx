import Link from "next/link";
import type { CSSProperties } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import AgentBanner from "@/components/landing/AgentBanner";
import InstituteContactFooter from "@/components/institute/InstituteContactFooter";
import { brandingStyle, type OwnerBranding } from "@/lib/owner-branding";
import type { InstituteProfile } from "@/lib/institute-profile";

// A single course card in the storefront grid.
export type StorefrontCourse = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  max_students: number;
  registered_count: number;
  slots_remaining: number;
  is_full: boolean;
  is_live_available: boolean;
  is_prerecorded_available: boolean;
};

// The shape returned by /api/frontend/i/{slug} and /api/frontend/institute/primary.
export type StorefrontData = {
  institute: { name: string; slug: string };
  branding: OwnerBranding;
  // Optional: the apex fallback view renders with no profile at all.
  profile?: InstituteProfile;
  courses: StorefrontCourse[];
};

function formatPrice(price: number): string {
  return price <= 0 ? "Free" : `₦${price.toLocaleString()}`;
}

const HEX6 = /^#[0-9a-fA-F]{6}$/;

// Feather the cover photo into the page like the main site's hero media
// (globals.css uses the same radial-mask trick): crisp toward the upper-centre,
// fading to fully transparent at the edges so the photo melts into the theme's
// background + pill glow instead of sitting as a hard rectangle.
const HERO_IMAGE_MASK = "radial-gradient(ellipse 92% 82% at 50% 22%, #000 42%, transparent 100%)";

// The wash laid OVER the hero cover photo. Because the photo is masked to blend
// into the page, this only needs to (a) keep the heading legible and (b) glow the
// institute's brand colour from the top — a TRANSLUCENT tint (the same "pill"
// shape the theme uses), never an opaque fill, so the photo still reads through
// and the hero blends into the dark theme instead of becoming a flat colour panel.
function heroOverlayStyle(branding: OwnerBranding): CSSProperties {
  const bg = branding.background_color;
  const scrim = "linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.12) 38%, transparent 100%)";
  if (bg && HEX6.test(bg)) {
    // brand pill glow on top of the legibility scrim (alpha: 5c≈36%, 24≈14%).
    return { background: `radial-gradient(110% 72% at 50% 0%, ${bg}5c 0%, ${bg}24 40%, transparent 72%), ${scrim}` };
  }
  return { background: scrim };
}

// Presentational storefront shared by the apex /institute page (primary tenant)
// and every per-institute /i/{slug} page. `brandingStyle` rebrands the subtree
// via CSS variables (logo, primary/secondary tokens, font) so each institute's
// page carries its own identity while reusing the exact site design/theme.
// `hrefBase` scopes course links to the right route ("/institute" or "/i/{slug}").
export default function InstituteStorefront({
  institute,
  branding,
  profile,
  courses,
  hrefBase,
  showAgentBanner = false,
  showHeroLogo = true,
}: StorefrontData & { hrefBase: string; showAgentBanner?: boolean; showHeroLogo?: boolean }) {
  return (
    <section style={brandingStyle(branding)}>
      <section className="section-pad relative overflow-hidden border-b border-site-border/30">
        {profile?.cover_url ? (
          <>
            {/* Cover photo sits INSIDE the hero as its background layer, masked
                so its edges feather into the page — the blended look, not a panel. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.cover_url}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              style={{ maskImage: HERO_IMAGE_MASK, WebkitMaskImage: HERO_IMAGE_MASK }}
            />
            {/* …with a translucent brand glow laid over it — the photo shows
                through while the institute's colour tints the hero. */}
            <div className="pointer-events-none absolute inset-0" style={heroOverlayStyle(branding)} />
          </>
        ) : null}
        <div className="container-wide relative z-10 space-y-6">
          {showHeroLogo && branding.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logo_url} alt={institute.name} className="h-14 w-auto object-contain" />
          ) : null}
          <SectionHeading title={institute.name} subtitle={profile?.tagline || "Training Institute"} />
          <div className="max-w-3xl text-site-text/75">
            {profile?.about ? (
              <p className="whitespace-pre-line">{profile.about}</p>
            ) : (
              <p>
                Join practical, career-focused programs taught by experienced instructors.
                Learn with structured classes, guided materials, and mentorship.
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="container-wide py-14">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`${hrefBase}/${course.slug}`}
              className="group rounded-xl border border-site-border/30 bg-site-surface-soft p-6 transition hover:border-site-border/60 hover:bg-site-surface"
            >
              <article>
                <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                  {course.title}
                </h3>
                {course.description ? (
                  <p className="mt-3 line-clamp-3 text-sm text-site-text/75">{course.description}</p>
                ) : null}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-2xl font-bold text-site-text">{formatPrice(course.price)}</span>
                  {course.is_full ? (
                    <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold" style={{ color: "#e11d48" }}>
                      Full
                    </span>
                  ) : course.max_students <= 0 ? (
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold" style={{ color: "#059669" }}>
                      Open
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold" style={{ color: "#059669" }}>
                      {course.slots_remaining} slot{course.slots_remaining !== 1 ? "s" : ""} left
                    </span>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  {course.is_live_available ? (
                    <span className="rounded-full border border-site-border/20 px-2 py-0.5 text-[11px] text-site-text/70">Live</span>
                  ) : null}
                  {course.is_prerecorded_available ? (
                    <span className="rounded-full border border-site-border/20 px-2 py-0.5 text-[11px] text-site-text/70">Pre-recorded</span>
                  ) : null}
                </div>
              </article>
            </Link>
          ))}
        </div>

        {courses.length === 0 ? (
          <div className="rounded-xl border border-site-border/30 bg-site-surface-soft p-8 text-center text-site-text/70">
            No courses available at the moment. Check back soon.
          </div>
        ) : null}
      </div>

      <InstituteContactFooter profile={profile} instituteName={institute.name} />

      {showAgentBanner ? <AgentBanner /> : null}
    </section>
  );
}
