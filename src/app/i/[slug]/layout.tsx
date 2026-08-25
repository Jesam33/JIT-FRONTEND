import { notFound } from "next/navigation";
import { brandingStyle, storefrontBackgroundStyle } from "@/lib/owner-branding";
import { hasContactInfo } from "@/lib/institute-profile";
import type { StorefrontData } from "@/components/institute/InstituteStorefront";
import InstituteHeader from "@/components/institute/InstituteHeader";
import InstituteSiteFooter from "@/components/institute/InstituteSiteFooter";

// Route-scoped chrome for every per-institute mini-site under /i/{slug}
// (the storefront AND its /i/{slug}/{courseSlug} course pages). AppChrome
// suppresses the global jorsastech Header/Footer on /i/* — this layout replaces
// them with the institute's OWN sticky header and slim footer, so navigating
// "Home"/logo keeps a visitor inside that institute's site instead of bouncing
// back to the primary marketing site.
//
// The fetch below is byte-for-byte identical to the one in i/[slug]/page.tsx, so
// Next's per-request fetch memoization collapses layout + page (+ the page's
// generateMetadata) into a single backend call — no extra round-trip, no
// backend change. Wrapping the subtree in brandingStyle(branding) is what
// rebrands the header itself (font + --color-* tokens).

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

async function getStorefront(slug: string): Promise<StorefrontData | null> {
  try {
    const baseUrl = process.env.LARAVEL_BACKEND_URL ?? "http://127.0.0.1:8000";
    const res = await fetch(`${baseUrl}/api/frontend/i/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function InstituteLayout({ children, params }: Props) {
  const { slug } = await params;
  const data = await getStorefront(slug);

  if (!data) {
    // Same verdict the page reaches — render the 404 chrome, not a broken shell.
    notFound();
  }

  return (
    <div style={{ ...brandingStyle(data.branding), ...storefrontBackgroundStyle(data.branding) }}>
      <InstituteHeader
        institute={data.institute}
        branding={data.branding}
        hrefBase={`/i/${slug}`}
        showContact={hasContactInfo(data.profile)}
      />
      {children}
      <InstituteSiteFooter institute={data.institute} />
    </div>
  );
}
