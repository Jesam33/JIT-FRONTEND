import { notFound } from "next/navigation";
import type { Metadata } from "next";
import InstituteCourseDetail, { type CourseDetailData } from "@/components/institute/InstituteCourseDetail";
import { pricingQuery } from "@/lib/pricing-query";

// This route's [slug] is a COURSE slug under the PRIMARY institute (JIT). It
// sources from the tenant-scoped primary course endpoint so the detail — and
// the register flow it hosts — stay bound to JIT only.
type Props = {
  params: Promise<{ slug: string }>;
};

async function getCourse(courseSlug: string): Promise<CourseDetailData | null> {
  try {
    const baseUrl = process.env.LARAVEL_BACKEND_URL ?? "http://127.0.0.1:8000";
    const res = await fetch(`${baseUrl}/api/frontend/institute/primary/courses/${courseSlug}${await pricingQuery()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCourse(slug);
  if (!data) return { title: "Course Not Found" };
  return {
    title: `${data.course.title} | ${data.institute.name}`,
    description: data.course.description ?? undefined,
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await getCourse(slug);

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
