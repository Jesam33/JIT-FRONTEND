"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PUBLIC_API } from "@/lib/api";
import { pinTenantFromLocation, getTenantSlug } from "@/lib/tenant-client";
import { brandingStyle, type OwnerBranding } from "@/lib/owner-branding";
import DynamicFavicon from "@/components/DynamicFavicon";

const PRIMARY = process.env.NEXT_PUBLIC_PRIMARY_TENANT_SLUG ?? "jorsas";

export default function BecomeAnAgentPage() {
  // Academy-aware: reached either from the apex (the Jorsas program, no tenant)
  // or from an academy storefront banner (/become-an-agent?tenant={slug}). When a
  // slug is present we pin it so the whole apply journey binds to that academy,
  // fetch its display name AND branding for the copy + palette, and carry
  // ?tenant= forward to the form. AppChrome drops the global Jorsas navbar/footer
  // on this route, so the page wears the academy's own colours (brandingStyle)
  // instead of Jorsas branding.
  const [tenant, setTenant] = useState<string | null>(null);
  const [academyName, setAcademyName] = useState<string | null>(null);
  const [branding, setBranding] = useState<OwnerBranding | null>(null);

  useEffect(() => {
    pinTenantFromLocation();
    const slug = new URL(window.location.href).searchParams.get("tenant");
    if (!slug) return;
    setTenant(slug);
    fetch(PUBLIC_API.storefront(slug))
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { institute?: { name?: string }; branding?: OwnerBranding } | null) => {
        if (d?.institute?.name) setAcademyName(d.institute.name);
        if (d?.branding) setBranding(d.branding);
      })
      .catch(() => {
        /* name + palette are decorative, fall back to the default theme */
      });
  }, []);

  // Title the browser tab with the academy, not the inherited "Jorsas Tech", on
  // a NON-primary academy (mirrors the public storefront). The favicon is swapped
  // by DynamicFavicon in the wrapper below.
  useEffect(() => {
    const name = (branding?.name ?? academyName)?.trim();
    const slug = getTenantSlug();
    if (name && slug && slug !== PRIMARY) {
      document.title = name;
    }
  }, [branding, academyName]);

  const brandName = academyName ?? "Jorsas";
  const applyHref = tenant
    ? `/become-an-agent/apply?tenant=${encodeURIComponent(tenant)}`
    : "/become-an-agent/apply";

  return (
    <div className="min-h-screen site-shell" style={brandingStyle(branding)}>
      <DynamicFavicon href={branding?.logo_url ?? null} fallbackColor={branding?.primary_color ?? null} isPrimary={branding?.is_primary ?? null} markText={branding?.name ?? null} />
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Become a <span className="text-site-text">{brandName} Admission Marketer</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-site-text/60">
          Earn commissions by referring students to {academyName ? `${academyName}'s` : "our"} courses. Help students find the right program and earn 10% on every enrollment.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-site-border bg-site-surface-soft p-6 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white" style={{ backgroundColor: "var(--color-primary)" }}>1</div>
            <h3 className="mt-4 font-semibold">Apply</h3>
            <p className="mt-2 text-sm text-site-text/60">Fill out your application. Tell us about your experience and which courses you want to promote.</p>
          </div>
          <div className="rounded-2xl border border-site-border bg-site-surface-soft p-6 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white" style={{ backgroundColor: "var(--color-primary)" }}>2</div>
            <h3 className="mt-4 font-semibold">Get Approved</h3>
            <p className="mt-2 text-sm text-site-text/60">Our team reviews your application. Once approved, you will receive your portal access and referral code.</p>
          </div>
          <div className="rounded-2xl border border-site-border bg-site-surface-soft p-6 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white" style={{ backgroundColor: "var(--color-primary)" }}>3</div>
            <h3 className="mt-4 font-semibold">Earn Commissions</h3>
            <p className="mt-2 text-sm text-site-text/60">Refer students using your unique code or register them directly. Earn 10% commission per enrollment.</p>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-site-border bg-site-surface-soft p-8">
          <h2 className="text-2xl font-semibold">Ready to get started?</h2>
          <p className="mt-2 text-site-text/60">Apply now and start earning commissions on every student you refer.</p>
          <Link
            href={applyHref}
            className="mt-6 inline-block rounded-full px-8 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
