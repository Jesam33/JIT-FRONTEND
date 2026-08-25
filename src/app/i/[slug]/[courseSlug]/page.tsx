import { notFound } from "next/navigation";
import type { Metadata } from "next";
import InstituteCourseDetail, { type CourseDetailData } from "@/components/institute/InstituteCourseDetail";

type Props = {
  params: Promise<{ slug: string; courseSlug: string }>;
};

async function getCourse(slug: string, courseSlug: string): Promise<CourseDetailData | null> {
  try {
    const baseUrl = process.env.LARAVEL_BACKEND_URL ?? "http://127.0.0.1:8000";
    const res = await fetch(`${baseUrl}/api/frontend/i/${slug}/courses/${courseSlug}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, courseSlug } = await params;
  const data = await getCourse(slug, courseSlug);
  if (!data) return { title: "Course Not Found" };
  return {
    title: `${data.course.title} | ${data.institute.name}`,
    description: data.course.description ?? undefined,
  };
}

export default async function InstituteCoursePage({ params }: Props) {
  const { slug, courseSlug } = await params;
  const data = await getCourse(slug, courseSlug);

  if (!data) {
    notFound();
  }

  return (
    <InstituteCourseDetail
      institute={data.institute}
      branding={data.branding}
      profile={data.profile}
      course={data.course}
      registerSlug={data.institute.slug}
    />
  );
}
