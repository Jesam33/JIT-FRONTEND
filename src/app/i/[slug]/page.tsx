import { notFound } from "next/navigation";
import type { Metadata } from "next";
import InstituteStorefront, { type StorefrontData } from "@/components/institute/InstituteStorefront";
import { pricingQuery } from "@/lib/pricing-query";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getStorefront(slug: string): Promise<StorefrontData | null> {
  try {
    const baseUrl = process.env.LARAVEL_BACKEND_URL ?? "http://127.0.0.1:8000";
    const res = await fetch(`${baseUrl}/api/frontend/i/${slug}${await pricingQuery()}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getStorefront(slug);
  if (!data) return { title: "Online Academy Not Found" };
  const logo = data.branding?.logo_url;
  const title = `${data.institute.name} | Courses`;
  const description = data.profile?.tagline || `Browse and enrol in courses at ${data.institute.name}.`;
  // The share image prefers the academy's cover photo, then its logo, so a shared
  // storefront link wears the academy's brand — not Jorsas' default OG image.
  const shareImage = data.profile?.cover_url || logo;
  return {
    title,
    description,
    // Use the institute's own logo as the browser-tab icon (fix #7) so the public
    // storefront wears the tenant's brand, not Jorsas'. Falls through to the
    // default favicon when the institute hasn't uploaded a logo.
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

export default async function InstituteStorefrontPage({ params }: Props) {
  const { slug } = await params;
  const data = await getStorefront(slug);

  if (!data) {
    notFound();
  }

  return (
    <InstituteStorefront
      institute={data.institute}
      branding={data.branding}
      profile={data.profile}
      courses={data.courses}
      hrefBase={`/i/${slug}`}
      showHeroLogo={false}
    />
  );
}
