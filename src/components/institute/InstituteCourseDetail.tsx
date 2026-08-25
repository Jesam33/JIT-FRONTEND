import { brandingStyle, type OwnerBranding } from "@/lib/owner-branding";
import type { InstituteProfile } from "@/lib/institute-profile";
import CourseRegisterClient from "@/components/institute/CourseRegisterClient";
import InstituteContactFooter from "@/components/institute/InstituteContactFooter";

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
};

// The shape returned by /api/frontend/i/{slug}/courses/{courseSlug} and the
// primary equivalent.
export type CourseDetailData = {
  institute: { name: string; slug: string };
  branding: OwnerBranding;
  // Optional: powers the shared contact footer at the foot of the mini-site.
  profile?: InstituteProfile;
  course: DetailCourse;
};

function formatPrice(price: number): string {
  return price <= 0 ? "Free" : `₦${price.toLocaleString()}`;
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
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">{institute.name}</p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
              {course.title}
            </h1>

            {course.description ? (
              <div className="mt-6 text-sm leading-7 text-white/85">
                <h2 className="mb-2 text-lg font-semibold text-white">About This Course</h2>
                <p>{course.description}</p>
              </div>
            ) : null}

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
            <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              {formatPrice(course.price)}
            </p>

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
              <CourseRegisterClient course={course} slug={registerSlug} />
            )}
          </aside>
        </div>
        </div>
      </section>

      <InstituteContactFooter profile={profile} instituteName={institute.name} />
    </div>
  );
}
