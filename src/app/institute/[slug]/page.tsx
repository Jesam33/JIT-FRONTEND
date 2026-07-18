import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import CourseRegisterClient from "./CourseRegisterClient";

type Props = {
  params: Promise<{ slug: string }>;
};

type CourseDetail = {
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

async function getCourse(slug: string): Promise<CourseDetail | null> {
  try {
    const baseUrl = process.env.LARAVEL_BACKEND_URL ?? "http://127.0.0.1:8000";
    const response = await fetch(`${baseUrl}/api/frontend/institute/courses/${slug}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function formatPrice(price: number): string {
  return price <= 0 ? "Free" : `₦${price.toLocaleString()}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) return { title: "Course Not Found" };
  return {
    title: `${course.title} | Jorsas Institute`,
    description: course.description ?? undefined,
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const course = await getCourse(slug);

  if (!course) {
    notFound();
  }

  return (
    <section className="section-pad section-divider">
      <div className="container-wide">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-xl border border-white/20 bg-white/5 p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Course Detail</p>
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
                  {course.is_full ? "Full" : course.slots_remaining}
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
              <div className="mt-6 rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                This course is currently full. Check back later for available slots.
              </div>
            ) : (
              <CourseRegisterClient course={course} />
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
