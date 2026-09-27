import { brandingStyle, type OwnerBranding } from "@/lib/owner-branding";
import type { InstituteProfile } from "@/lib/institute-profile";
import CourseAside from "@/components/institute/CourseAside";
import CourseRegisterClient from "@/components/institute/CourseRegisterClient";
import InstituteContactFooter from "@/components/institute/InstituteContactFooter";
import CourseDescription from "@/components/institute/CourseDescription";
import CourseRequirements from "@/components/institute/CourseRequirements";
import StarRating from "@/components/ui/StarRating";

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
  // Cohort registration window (see LmsTrack::registrationOpen). False when
  // every cohort's cutoff has passed; a no-cohort course stays true.
  registration_open?: boolean;
  registration_closes_at?: string | null;
  next_cohort_starts_at?: string | null;
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
  // Udemy-style card signals (honestly derived server-side, see CourseCards).
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
  // See StorefrontData, true keeps the "Powered by Jorsas" strip (free tier),
  // false when a paid plan removes branding.
  institute: { name: string; slug: string; show_powered_by?: boolean };
  branding: OwnerBranding;
  // Optional: powers the shared contact footer at the foot of the mini-site.
  profile?: InstituteProfile;
  course: DetailCourse;
};

// The big headline price, the struck-through "was" price and the charge note all
// live in CourseAside now: they follow the delivery mode chosen in the register
// form, which makes them stateful, so they cannot stay server-rendered here.

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
            {/* Cover hero, owner upload or branded initial placeholder. */}
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

            {/* One requirement per line, clamped with a See more toggle when the
                list runs long (CourseRequirements). */}
            {course.requirements ? <CourseRequirements text={course.requirements} /> : null}

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
            {/* Price panel. Owns the delivery-mode state the register form below
                publishes into, so the headline price reprices itself when the
                visitor picks Pre-recorded (see CourseAside). */}
            <CourseAside
              course={course}
              footer={
                /* Registration gate mirrors is_full: full and closed both hide the
                   form (the backend rejects a direct submit with the same message). */
                course.is_full ? (
                  <div className="mt-6 rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 text-sm" style={{ color: "#d97706" }}>
                    This course is currently full. Check back later for available slots.
                  </div>
                ) : course.registration_open === false ? (
                  <div className="mt-6 rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 text-sm" style={{ color: "#d97706" }}>
                    Registration for this course has closed. Please check back for the next cohort.
                    {course.next_cohort_starts_at ? (
                      <span className="block mt-1">
                        The next cohort starts {new Date(course.next_cohort_starts_at).toLocaleDateString()}.
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <CourseRegisterClient course={course} slug={registerSlug} branding={branding} />
                )
              }
            >
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
            </CourseAside>
          </aside>
        </div>
        </div>
      </section>

      <InstituteContactFooter profile={profile} instituteName={institute.name} />

    </div>
  );
}
