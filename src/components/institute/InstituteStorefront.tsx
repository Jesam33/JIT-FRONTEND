import Link from "next/link";
import type { CSSProperties } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import StarRating from "@/components/ui/StarRating";
import AgentBanner from "@/components/landing/AgentBanner";
import InstituteContactFooter from "@/components/institute/InstituteContactFooter";
import CurrencySwitcher from "@/components/institute/CurrencySwitcher";
import { brandingStyle, type OwnerBranding } from "@/lib/owner-branding";
import { formatPrice } from "@/lib/currency";
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
  // Localized DISPLAY pricing (cosmetic — money is still charged in NGN/USD).
  // Present on every course from the backend; optional here so a partially
  // built view (e.g. the apex empty-shell fallback) still type-checks.
  currency?: string;
  display_currency?: string;
  display_symbol?: string;
  price_display?: number;
  is_base_currency?: boolean;
  charge_currency?: string;
  purchasable?: boolean;
  // Udemy-style card signals (all honestly derived server-side; see CourseCards).
  // A "was" price shown struck-through only when it exceeds the current price;
  // ratings from real reviews (0/0 → no stars); owner-uploaded cover or null;
  // instructor line from the course's track(s); bestseller from real enrollments.
  original_price?: number | null;
  original_price_display?: number | null;
  cover_image_url?: string | null;
  rating_average?: number;
  rating_count?: number;
  instructor_name?: string | null;
  is_bestseller?: boolean;
};

// The shape returned by /api/frontend/i/{slug} and /api/frontend/institute/primary.
export type StorefrontData = {
  institute: { name: string; slug: string };
  branding: OwnerBranding;
  // Optional: the apex fallback view renders with no profile at all.
  profile?: InstituteProfile;
  courses: StorefrontCourse[];
};

// Render a course's price in the visitor's display currency. Free courses (base
// NGN price ≤ 0 are free everywhere) always read "Free"; a converted price is
// prefixed "≈" to signal it's an FX estimate (the real charge is NGN/USD).
function coursePrice(course: StorefrontCourse): string {
  if (course.price <= 0) return "Free";
  const amount = course.price_display ?? course.price;
  const currency = course.display_currency ?? "NGN";
  const prefix = course.is_base_currency === false ? "≈ " : "";
  return `${prefix}${formatPrice(amount, currency)}`;
}

// The struck-through "was" price — rendered ONLY when a real original price was
// entered AND it exceeds the current price (never auto-invented). Compared in the
// same space as coursePrice (both display, or both base NGN) so the test is fair.
function courseOriginalPrice(course: StorefrontCourse): string | null {
  if (course.price <= 0) return null;
  const orig = course.original_price_display ?? course.original_price ?? null;
  const current = course.price_display ?? course.price;
  if (orig == null || !(orig > current)) return null;
  return formatPrice(orig, course.display_currency ?? "NGN");
}

// First character of the title, for the branded placeholder when no cover is set.
function coverInitial(title: string): string {
  const c = (title || "").trim().charAt(0);
  return c ? c.toUpperCase() : "•";
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
        {courses.some((c) => c.price > 0) ? (
          <div className="mb-6 flex items-center justify-end gap-2 text-sm text-site-text/70">
            <span>Prices in</span>
            <CurrencySwitcher active={courses.find((c) => c.price > 0)?.display_currency ?? "NGN"} />
          </div>
        ) : null}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const original = courseOriginalPrice(course);
            const rated = (course.rating_count ?? 0) > 0;
            return (
            <Link
              key={course.id}
              href={`${hrefBase}/${course.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-site-border/30 bg-site-surface-soft transition hover:border-site-border/60 hover:bg-site-surface"
            >
              <article className="flex h-full flex-col">
                {/* Cover — owner upload, or a branded initial placeholder (never a
                    stock photo). Brand-colored inset ring frames it like the ref card. */}
                <div className="relative aspect-video w-full overflow-hidden bg-site-surface ring-1 ring-inset ring-[color:var(--color-primary)]/40">
                  {course.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.cover_image_url}
                      alt={course.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{ background: "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 45%, #000))" }}
                    >
                      <span className="text-5xl font-black text-white/90" style={{ fontFamily: "var(--font-display)" }}>
                        {coverInitial(course.title)}
                      </span>
                    </div>
                  )}
                  {course.is_full ? (
                    <span className="absolute right-2 top-2 rounded-full bg-rose-500/90 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      Full
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 text-base font-bold leading-snug text-site-text" style={{ fontFamily: "var(--font-display)" }}>
                    {course.title}
                  </h3>
                  {course.instructor_name ? (
                    <p className="mt-1 truncate text-xs text-site-text/60">{course.instructor_name}</p>
                  ) : null}

                  {/* Real ratings only (0 reviews → a subtle "New" chip, never a fake number). */}
                  <div className="mt-2 min-h-[20px]">
                    {rated ? (
                      <StarRating value={course.rating_average ?? 0} count={course.rating_count ?? 0} size="sm" />
                    ) : (
                      <span className="rounded bg-site-text/10 px-2 py-0.5 text-[11px] font-semibold text-site-text/60">New</span>
                    )}
                  </div>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-site-text">{coursePrice(course)}</span>
                    {original ? <span className="text-sm text-site-text/45 line-through">{original}</span> : null}
                  </div>

                  {/* Bestseller (real top-enrolled) + delivery mode + slots, pinned to the foot. */}
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                    {course.is_bestseller ? (
                      <span className="rounded-sm px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: "#ccfbf1", color: "#115e59" }}>
                        Bestseller
                      </span>
                    ) : null}
                    {course.is_live_available ? (
                      <span className="rounded-full border border-site-border/20 px-2 py-0.5 text-[11px] text-site-text/70">Live</span>
                    ) : null}
                    {course.is_prerecorded_available ? (
                      <span className="rounded-full border border-site-border/20 px-2 py-0.5 text-[11px] text-site-text/70">Pre-recorded</span>
                    ) : null}
                    {!course.is_full && course.max_students > 0 ? (
                      <span className="ml-auto text-[11px] font-medium" style={{ color: "#059669" }}>
                        {course.slots_remaining} slot{course.slots_remaining !== 1 ? "s" : ""} left
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            </Link>
            );
          })}
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
