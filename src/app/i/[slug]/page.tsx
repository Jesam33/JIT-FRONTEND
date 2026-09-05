import { notFound } from "next/navigation";
import type { Metadata } from "next";
import InstituteStorefront, { type StorefrontData } from "@/components/institute/InstituteStorefront";
import { pricingQuery } from "@/lib/pricing-query";
import { initialMarkDataUri } from "@/lib/initial-mark";

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
  // The browser-tab icon is the academy's own logo (fix #7) so the public
  // storefront wears the tenant's brand, not Jorsas'. When the academy has NOT
  // uploaded a logo we generate an initial mark (its name's first letter on its
  // brand color) rather than fall through to the Jorsas "J" — but only for a
  // non-primary academy; the Jorsas primary keeps its real branded icon.
  const primarySlug = process.env.NEXT_PUBLIC_PRIMARY_TENANT_SLUG ?? "jorsas";
  const iconHref =
    logo ??
    (slug !== primarySlug
      ? initialMarkDataUri(data.institute.name, data.branding?.primary_color ?? null)
      : undefined);
  return {
    title,
    description,
    ...(iconHref ? { icons: { icon: iconHref } } : {}),
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
      showAgentBanner={data.institute.show_agent_program ?? false}
      agentTenantSlug={slug}
    />
  );
}
