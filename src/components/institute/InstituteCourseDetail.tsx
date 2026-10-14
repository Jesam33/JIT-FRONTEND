import type { ReactNode } from "react";
import { brandingStyle, type OwnerBranding } from "@/lib/owner-branding";
import type { InstituteProfile } from "@/lib/institute-profile";
import CourseAside from "@/components/institute/CourseAside";
import CourseRegisterClient from "@/components/institute/CourseRegisterClient";
import InstituteContactFooter from "@/components/institute/InstituteContactFooter";
import CourseDescription from "@/components/institute/CourseDescription";
import CourseRequirements from "@/components/institute/CourseRequirements";
import StarRating from "@/components/ui/StarRating";
import CourseReviews, { type CourseReviewsData } from "@/components/institute/CourseReviews";

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
  // "monthly": prices are per month (students pay every month).
  billing_type?: "one_time" | "monthly";
  // One-on-one: private sessions at their own price.
  is_one_on_one_available?: boolean;
  one_on_one_price?: number | null;
  one_on_one_price_display?: number | null;
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
  // Verified-learner reviews (star breakdown + latest reviews with proof).
  reviews?: CourseReviewsData | null;
};

// First character of the title, for the branded placeholder when no cover is set.
function coverInitial(title: string): string {
  const c = (title || "").trim().charAt(0);
  return c ? c.toUpperCase() : "•";
}

function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// The header's one-line summary: the description's opening, cut at a word.
// Only for a description long enough to need one; a short one already reads in
// full in "About this course" just below, so repeating it would only echo.
const SUMMARY_FROM = 240;

function summaryOf(text: string | null): string | null {
  const flat = (text ?? "").replace(/\s+/g, " ").trim();
  if (flat.length < SUMMARY_FROM) return null;
  const cut = flat.slice(0, 170);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), 120)).replace(/[,;:.\s]+$/, "") + "…";
}

// Small outline icons for the page's fact rows (currentColor, 24px grid).
const ICONS: Record<string, ReactNode> = {
  live: (
    <>
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="m22 8-6 4 6 4z" />
    </>
  ),
  play: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m10 8 6 4-6 4z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  card: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  ),
  chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
};

function Icon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

// Presentational course page shared by the apex primary course route and every
// per-institute /i/{slug}/{courseSlug} route. Every fact on it comes from the
// course itself (no invented durations, module counts or "lifetime access").
// `registerSlug` is threaded into the register form so the sign-up binds to the
// correct institute even though the page is server-rendered without a tenant cookie.
export default function InstituteCourseDetail({
  institute,
  branding,
  profile,
  course,
  reviews,
  registerSlug,
}: CourseDetailData & { registerSlug?: string }) {
  const ratingCount = course.rating_count ?? 0;
  const rating = course.rating_average ?? 0;
  const monthly = course.price > 0 && course.billing_type === "monthly";
  const summary = summaryOf(course.description);
  const startDate = fmtDate(course.next_cohort_starts_at);
  const closesDate = course.registration_open === false ? null : fmtDate(course.registration_closes_at);
  const capped = course.max_students > 0;
  const filledPct = capped ? Math.min(100, Math.round((course.registered_count / course.max_students) * 100)) : 0;

  const modes = [
    course.is_live_available ? "Live classes" : null,
    course.is_prerecorded_available ? "Pre-recorded" : null,
    course.is_one_on_one_available ? "One-on-one" : null,
  ].filter(Boolean) as string[];

  // "What you get": only what this course really offers.
  const includes: { icon: string; title: string; text: string }[] = [];
  if (course.is_live_available) {
    includes.push({ icon: "live", title: "Live classes", text: "Learn live with your teacher and classmates, ask questions as you go." });
  }
  if (course.is_prerecorded_available) {
    includes.push({ icon: "play", title: "Pre-recorded lessons", text: "Watch the lessons on your own schedule, as often as you like." });
  }
  if (course.is_one_on_one_available) {
    includes.push({ icon: "user", title: "One-on-one sessions", text: "Private sessions with a teacher, at a time that suits you." });
  }
  if (course.instructor_name) {
    includes.push({ icon: "users", title: `Taught by ${course.instructor_name}`, text: `Part of ${institute.name}.` });
  }
  if (capped) {
    includes.push({ icon: "users", title: `Small class: up to ${course.max_students}`, text: "Limited seats, so you get attention when you need it." });
  }
  includes.push({ icon: "chat", title: "Student portal", text: "Your classes, materials, tasks and class chat in one place, on phone or computer." });
  if (course.price > 0) {
    includes.push({
      icon: "card",
      title: monthly ? "Pay monthly" : "One payment",
      text: monthly ? "Pay each month to keep your access, and stop any time." : "Pay once for the whole course.",
    });
  }

  return (
    <div style={brandingStyle(branding)}>
      {/* One layout for header + body, so the purchase card starts level with
          the title instead of being pulled up into a separate band. A soft
          glow in the academy's colour sits behind the top and fades into the
          page's own background: no hard-edged band. */}
      <section
        className="pb-14 pt-8 md:pt-10"
        style={{ background: "radial-gradient(ellipse 80% 420px at 15% 0%, color-mix(in srgb, var(--color-primary) 22%, transparent), transparent 70%)" }}
      >
        <div className="container-wide grid items-start gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* ── Header (left, row 1) ───────────────────────────────────── */}
          <header className="min-w-0 lg:col-start-1 lg:row-start-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">{institute.name}</p>

            {course.is_bestseller || modes.length || monthly ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {course.is_bestseller ? (
                  <span className="rounded-sm px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: "#ccfbf1", color: "#115e59" }}>
                    Bestseller
                  </span>
                ) : null}
                {modes.map((m) => (
                  <span key={m} className="rounded-full border border-white/20 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-white/85">
                    {m}
                  </span>
                ))}
                {monthly ? (
                  <span className="rounded-full border border-white/20 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-white/85">Monthly</span>
                ) : null}
              </div>
            ) : null}

            <h1 className="mt-3 text-3xl font-bold leading-tight text-white md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
              {course.title}
            </h1>
            {summary ? <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/75">{summary}</p> : null}

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/70">
              {ratingCount > 0 ? (
                <a href="#reviews" className="inline-flex items-center gap-1.5 transition hover:text-white">
                  <span className="font-semibold text-amber-300">{rating.toFixed(1)}</span>
                  <StarRating value={rating} size="sm" hideValue />
                  <span className="underline decoration-white/30 underline-offset-2">
                    {ratingCount} review{ratingCount === 1 ? "" : "s"}
                  </span>
                </a>
              ) : (
                <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/75">New course</span>
              )}
              {course.registered_count > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="users" /> {course.registered_count} student{course.registered_count === 1 ? "" : "s"}
                </span>
              ) : null}
              {course.instructor_name ? (
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="user" /> By <span className="font-medium text-white">{course.instructor_name}</span>
                </span>
              ) : null}
            </div>

            {startDate || closesDate ? (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/70">
                {startDate ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="calendar" /> Next class starts <span className="font-medium text-white">{startDate}</span>
                  </span>
                ) : null}
                {closesDate ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="clock" /> Registration closes <span className="font-medium text-white">{closesDate}</span>
                  </span>
                ) : null}
              </div>
            ) : null}
          </header>

          {/* ── Purchase card (right, spans both rows; 2nd on phones) ──── */}
          <aside className="overflow-hidden rounded-2xl border border-white/15 bg-[#0d0d0d] shadow-2xl lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div className="relative aspect-video w-full">
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
            </div>

            <div className="p-6">
              {/* Price panel. Owns the delivery-mode state the register form
                  below publishes into, so the headline price reprices itself
                  when the visitor picks another mode (see CourseAside). */}
              <CourseAside
                course={course}
                footer={
                  /* Registration gate mirrors is_full: full and closed both hide
                     the form (the backend rejects a direct submit the same way). */
                  course.is_full ? (
                    <div className="mt-5 rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">
                      This course is full right now. Check back later for new seats.
                    </div>
                  ) : course.registration_open === false ? (
                    <div className="mt-5 rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">
                      Registration for this course has closed. Please check back for the next class.
                      {startDate ? <span className="mt-1 block">The next class starts {startDate}.</span> : null}
                    </div>
                  ) : (
                    <CourseRegisterClient course={course} slug={registerSlug} academySlug={institute.slug} branding={branding} />
                  )
                }
              >
                {/* Seats: a filling bar when the class has a cap. */}
                <div className="mt-5">
                  {capped ? (
                    <>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-white/60">
                          {course.registered_count} of {course.max_students} seats taken
                        </span>
                        <span className={`font-semibold ${course.is_full || course.slots_remaining <= 5 ? "text-amber-300" : "text-white"}`}>
                          {course.is_full ? "Full" : `${course.slots_remaining} left`}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full" style={{ width: `${filledPct}%`, background: "var(--color-primary)" }} />
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-white/60">Open enrolment: no seat limit.</p>
                  )}
                </div>
              </CourseAside>
            </div>
          </aside>

          {/* ── Content (left, row 2; last on phones) ──────────────────── */}
          <div className="min-w-0 space-y-6 lg:col-start-1 lg:row-start-2">
            {includes.length ? (
              <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 md:p-8">
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                  What you get
                </h2>
                <ul className="mt-5 grid gap-5 sm:grid-cols-2">
                  {includes.map((it) => (
                    <li key={it.title} className="flex gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                        style={{ background: "color-mix(in srgb, var(--color-primary) 25%, transparent)" }}
                      >
                        <Icon name={it.icon} className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-white">{it.title}</span>
                        <span className="mt-0.5 block text-sm leading-relaxed text-white/60">{it.text}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {course.description ? (
              <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 md:p-8 [&>div]:mt-0">
                <CourseDescription text={course.description} />
              </section>
            ) : null}

            {/* One requirement per line, clamped with a See more toggle when the
                list runs long (CourseRequirements). */}
            {course.requirements ? (
              <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 md:p-8 [&>div]:mt-0">
                <CourseRequirements text={course.requirements} />
              </section>
            ) : null}

            <CourseReviews reviews={reviews} average={rating} count={ratingCount} instituteName={institute.name} />
          </div>
        </div>
      </section>

      <InstituteContactFooter profile={profile} instituteName={institute.name} />
    </div>
  );
}
