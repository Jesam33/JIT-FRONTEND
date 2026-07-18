import Link from "next/link";
import InnerPageHero from "@/components/layout/InnerPageHero";
import AgentBanner from "@/components/landing/AgentBanner";

type Course = {
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

async function getCourses(): Promise<Course[]> {
  try {
    const baseUrl = process.env.LARAVEL_BACKEND_URL ?? "http://127.0.0.1:8000";
    const response = await fetch(`${baseUrl}/api/frontend/institute/courses`, {
      cache: "no-store",
    });
    return await response.json();
  } catch {
    return [];
  }
}

function formatPrice(price: number): string {
  return price <= 0 ? "Free" : `₦${price.toLocaleString()}`;
}

export default async function InstitutePage() {
  const courses = await getCourses();

  return (
    <section>
      <InnerPageHero title="Jorsas Institute of Technology" subtitle="Training Institute">
        <p>
          Join practical, career-focused programs taught by experienced instructors.
          Learn with structured classes, guided materials, and mentorship.
        </p>
      </InnerPageHero>

      <div className="container-wide py-14">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/institute/${course.slug}`}
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
                    <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-200">
                      Full
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
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

      <AgentBanner />
    </section>
  );
}
