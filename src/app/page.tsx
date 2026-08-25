import Hero from "@/components/landing/Hero";
import { default as IungoBanner } from "@/components/landing/IungoBanner";
import TrainingInstituteBanner from "@/components/landing/TrainingInstituteBanner";
import Newsletter from "@/components/landing/Newsletter";
import { cookies } from "next/headers";

const BACKEND = process.env.LARAVEL_BACKEND_URL ?? "http://127.0.0.1:8000";

async function getTenant(slug: string) {
  try {
    const res = await fetch(`${BACKEND}/api/tenant/resolve?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.tenant ?? null;
  } catch {
    return null;
  }
}

export default async function Home() {
  const cookieStore = await cookies();
  const slug = cookieStore.get?.("tenant")?.value ?? null;
  const tenant = slug ? await getTenant(slug) : null;

  return (
    <>
      {tenant ? (
        <div className="bg-yellow-50 border-b p-3 text-sm text-yellow-800">You are viewing content for <strong>{tenant.name}</strong> ({tenant.slug})</div>
      ) : null}
      <Hero />
      <IungoBanner />
      {/* <TrainingInstituteBanner /> */}
      {/* <Newsletter /> */}
    </>
  );
}
