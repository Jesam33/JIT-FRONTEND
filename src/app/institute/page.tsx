import InstituteStorefront, { type StorefrontData } from "@/components/institute/InstituteStorefront";
import { pricingQuery } from "@/lib/pricing-query";

// The apex "Institute" page shows the PRIMARY institute (JIT) only. It sources
// from the tenant-scoped /primary endpoint — which binds Tenant::primary() on
// the backend — so it no longer leaks every tenant's courses the way the old
// unscoped catalog did.
async function getStorefront(): Promise<StorefrontData | null> {
  try {
    const baseUrl = process.env.LARAVEL_BACKEND_URL ?? "http://127.0.0.1:8000";
    const res = await fetch(`${baseUrl}/api/frontend/institute/primary${await pricingQuery()}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function InstitutePage() {
  const data = await getStorefront();

  // /primary returns an empty (200) storefront even with no tenant, so a null
  // here means the backend was unreachable — render an empty shell rather than
  // crash the marketing page.
  const view: StorefrontData = data ?? {
    institute: { name: "Jorsas Institute of Technology", slug: "" },
    branding: {},
    courses: [],
  };

  return (
    <InstituteStorefront
      institute={view.institute}
      branding={view.branding}
      profile={view.profile}
      courses={view.courses}
      hrefBase="/institute"
      showAgentBanner
    />
  );
}
