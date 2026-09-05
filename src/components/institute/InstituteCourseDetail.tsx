import { brandingStyle, type OwnerBranding } from "@/lib/owner-branding";
import type { InstituteProfile } from "@/lib/institute-profile";
import CourseRegisterClient from "@/components/institute/CourseRegisterClient";
import InstituteContactFooter from "@/components/institute/InstituteContactFooter";
import CurrencySwitcher from "@/components/institute/CurrencySwitcher";
import CourseDescription from "@/components/institute/CourseDescription";
import StarRating from "@/components/ui/StarRating";
import { formatPrice } from "@/lib/currency";

export type DetailCourse = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  requirements: string | null;
  price: number;
  max_students: number;
  registered_count: number;
  slots_remaining: number;
  is_full: boolean;
  is_live_available: boolean;
  is_prerecorded_available: boolean;
  // Localized DISPLAY pricing + the purchasable gate (see PublicInstituteController).
  // Optional so any older caller still type-checks; the backend always sends them.
  currency?: string;
  display_currency?: string;
  display_symbol?: string;
  price_display?: number;
  is_base_currency?: boolean;
  charge_currency?: string;
  purchasable?: boolean;
  // Optional cheaper pre-recorded price (null → one price for both modes).
  // `_display` mirrors the FX path used for the live `price_display`.
  prerecorded_price?: number | null;
  prerecorded_price_display?: number | null;
  // Udemy-style card signals (honestly derived server-side — see CourseCards).
  original_price?: number | null;
  original_price_display?: number | null;
  cover_image_url?: string | null;
  rating_average?: number;
  rating_count?: number;
  instructor_name?: string | null;
  is_bestseller?: boolean;
};

// The shape returned by /api/frontend/i/{slug}/courses/{courseSlug} and the
// primary equivalent.
export type CourseDetailData = {
  // See StorefrontData — true keeps the "Powered by Jorsas" strip (free tier),
  // false when a paid plan removes branding.
  institute: { name: string; slug: string; show_powered_by?: boolean };
  branding: OwnerBranding;
  // Optional: powers the shared contact footer at the foot of the mini-site.
  profile?: InstituteProfile;
  course: DetailCourse;
};

// The big headline price in the visitor's display currency (free → "Free").
function headlinePrice(course: DetailCourse): string {
  if (course.price <= 0) return "Free";
  return formatPrice(course.price_display ?? course.price, course.display_currency ?? "NGN");
}

// The struck-through "was" price beside the headline — only when a real original
// was entered AND it exceeds the current price (compared in the same currency space).
function detailOriginalPrice(course: DetailCourse): string | null {
  if (course.price <= 0) return null;
  const orig = course.original_price_display ?? course.original_price ?? null;
  const current = course.price_display ?? course.price;
  if (orig == null || !(orig > current)) return null;
  return formatPrice(orig, course.display_currency ?? "NGN");
}

// The cheaper pre-recorded price, shown as a secondary line beneath the headline
// (which is the live price — the register form defaults to Live). Only rendered
// when the course sets a distinct, genuinely lower pre-recorded price.
function prerecordedPriceLabel(course: DetailCourse): string | null {
  if (course.price <= 0) return null;
  const pre = course.prerecorded_price_display ?? course.prerecorded_price ?? null;
  if (pre == null) return null;
  const live = course.price_display ?? course.price;
  if (!(pre < live)) return null;
  return formatPrice(pre, course.display_currency ?? "NGN");
}

// First character of the title, for the branded placeholder when no cover is set.
function coverInitial(title: string): string {
  const c = (title || "").trim().charAt(0);
  return c ? c.toUpperCase() : "•";
}

// Presentational course-detail page shared by the apex primary course route and
// every per-institute /i/{slug}/{courseSlug} route. `registerSlug` is threaded
// into the register form so the sign-up binds to the correct institute even
// though the page is server-rendered without a tenant cookie.
export default function InstituteCourseDetail({
  institute,
  branding,
  profile,
  course,
  registerSlug,
}: CourseDetailData & { registerSlug?: string }) {
  return (
    <div style={brandingStyle(branding)}>
      <section className="section-pad section-divider">
        <div className="container-wide">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-xl border border-white/20 bg-white/5 p-6 md:p-8">
            {/* Cover hero — owner upload or branded initial placeholder. */}
            <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-lg ring-1 ring-inset ring-[color:var(--color-primary)]/40">
              {course.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={course.cover_image_url} alt={course.title} className="h-full w-full object-cover" />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ background: "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 45%, #000))" }}
                >
                  <span className="text-6xl font-black text-white/90" style={{ fontFamily: "var(--font-display)" }}>
                    {coverInitial(course.title)}
                  </span>
                </div>
              )}
              {course.is_bestseller ? (
                <span className="absolute left-3 top-3 rounded-sm px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: "#ccfbf1", color: "#115e59" }}>
                  Bestseller
                </span>
              ) : null}
            </div>

            <p className="text-xs uppercase tracking-[0.2em] text-white/60">{institute.name}</p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
              {course.title}
            </h1>

            {/* Rating summary (real reviews only) + instructor line. */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
              {(course.rating_count ?? 0) > 0 ? (
                <StarRating value={course.rating_average ?? 0} count={course.rating_count ?? 0} size="md" labelClassName="text-white/70" />
              ) : (
                <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/70">New course</span>
              )}
              {course.instructor_name ? (
                <span className="text-sm text-white/60">By {course.instructor_name}</span>
              ) : null}
            </div>

            {course.description ? <CourseDescription text={course.description} /> : null}

            {course.requirements ? (
              <div className="mt-6 text-sm leading-7 text-white/85">
                <h2 className="mb-2 text-lg font-semibold text-white">Requirements</h2>
                <p>{course.requirements}</p>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              {course.is_live_available ? (
                <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/80">
                  Live Classes Available
                </span>
              ) : null}
              {course.is_prerecorded_available ? (
                <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/80">
                  Pre-recorded Available
                </span>
              ) : null}
            </div>
          </article>

          <aside className="h-fit rounded-xl border border-white/20 bg-white/5 p-6">
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                {headlinePrice(course)}
              </p>
              {detailOriginalPrice(course) ? (
                <span className="text-lg text-white/40 line-through">{detailOriginalPrice(course)}</span>
              ) : null}
              {prerecordedPriceLabel(course) ? (
                <span className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] uppercase tracking-wide text-white/60">
                  live
                </span>
              ) : null}
            </div>
            {prerecordedPriceLabel(course) ? (
              <p className="mt-1 text-sm text-white/75">
                or <span className="font-semibold text-white">{prerecordedPriceLabel(course)}</span> pre-recorded
              </p>
            ) : null}
            {course.price > 0 && course.is_base_currency === false ? (
              <p className="mt-1 text-xs text-white/60">
                Approx. shown in {course.display_currency} · you&apos;ll be charged{" "}
                {course.charge_currency === "USD" ? "in USD" : formatPrice(course.price, "NGN")}
              </p>
            ) : null}
            {course.price > 0 ? (
              <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
                <span>Show price in</span>
                <CurrencySwitcher active={course.display_currency ?? "NGN"} />
              </div>
            ) : null}

            <div className="mt-4 space-y-3 text-sm text-white/75">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span>Slots remaining</span>
                <span className="font-semibold text-white">
                  {course.is_full ? "Full" : course.max_students > 0 ? course.slots_remaining : "Open"}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span>Total capacity</span>
                <span className="font-semibold text-white">
                  {course.max_students > 0 ? course.max_students : "Unlimited"}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span>Registered</span>
                <span className="font-semibold text-white">{course.registered_count}</span>
              </div>
            </div>

            {course.is_full ? (
              <div className="mt-6 rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 text-sm" style={{ color: "#d97706" }}>
                This course is currently full. Check back later for available slots.
              </div>
            ) : (
              <CourseRegisterClient course={course} slug={registerSlug} branding={branding} />
            )}
          </aside>
        </div>
        </div>
      </section>

      <InstituteContactFooter profile={profile} instituteName={institute.name} />

    </div>
  );
}
