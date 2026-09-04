import { notFound } from "next/navigation";
import type { Metadata } from "next";
import InstituteCourseDetail, { type CourseDetailData } from "@/components/institute/InstituteCourseDetail";
import { pricingQuery } from "@/lib/pricing-query";

type Props = {
  params: Promise<{ slug: string; courseSlug: string }>;
};

async function getCourse(slug: string, courseSlug: string): Promise<CourseDetailData | null> {
  try {
    const baseUrl = process.env.LARAVEL_BACKEND_URL ?? "http://127.0.0.1:8000";
    const res = await fetch(`${baseUrl}/api/frontend/i/${slug}/courses/${courseSlug}${await pricingQuery()}`, { cache: "no-store" });
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
  const title = `${data.course.title} | ${data.institute.name}`;
  const description = data.course.description ?? `Enrol in ${data.course.title} at ${data.institute.name}.`;
  // The academy's own logo is the browser-tab icon, and the course cover (or the
  // logo) is the social-share image, so a shared course link wears the academy's
  // brand, not Jorsas'. Both fall through to the app defaults when absent.
  const logo = data.branding?.logo_url;
  const shareImage = data.course.cover_image_url || logo;
  return {
    title,
    description,
    ...(logo ? { icons: { icon: logo } } : {}),
    openGraph: {
      title,
      description,
      ...(shareImage ? { images: [{ url: shareImage }] } : {}),
    },
    twitter: {
      card: shareImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(shareImage ? { images: [shareImage] } : {}),
    },
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
