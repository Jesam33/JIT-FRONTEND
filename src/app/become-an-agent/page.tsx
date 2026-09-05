"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PUBLIC_API } from "@/lib/api";
import { pinTenantFromLocation } from "@/lib/tenant-client";

export default function BecomeAnAgentPage() {
  // Academy-aware: reached either from the apex (the Jorsas program, no tenant)
  // or from an academy storefront banner (/become-an-agent?tenant={slug}). When a
  // slug is present we pin it so the whole apply journey binds to that academy,
  // fetch its display name for the copy, and carry ?tenant= forward to the form.
  const [tenant, setTenant] = useState<string | null>(null);
  const [academyName, setAcademyName] = useState<string | null>(null);

  useEffect(() => {
    pinTenantFromLocation();
    const slug = new URL(window.location.href).searchParams.get("tenant");
    if (!slug) return;
    setTenant(slug);
    fetch(PUBLIC_API.storefront(slug))
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { institute?: { name?: string } } | null) => {
        if (d?.institute?.name) setAcademyName(d.institute.name);
      })
      .catch(() => {
        /* name is decorative — fall back to the generic heading */
      });
  }, []);

  const brandName = academyName ?? "Jorsas";
  const applyHref = tenant
    ? `/become-an-agent/apply?tenant=${encodeURIComponent(tenant)}`
    : "/become-an-agent/apply";

  return (
    <div className="min-h-screen site-shell">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Become a <span className="text-site-text">{brandName} Admission Marketer</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-site-text/60">
          Earn commissions by referring students to {academyName ? `${academyName}'s` : "our"} courses. Help students find the right program and earn 10% on every enrollment.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-site-border bg-site-surface-soft p-6 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-400 text-lg font-bold">1</div>
            <h3 className="mt-4 font-semibold">Apply</h3>
            <p className="mt-2 text-sm text-site-text/60">Fill out your application. Tell us about your experience and which courses you want to promote.</p>
          </div>
          <div className="rounded-2xl border border-site-border bg-site-surface-soft p-6 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-400 text-lg font-bold">2</div>
            <h3 className="mt-4 font-semibold">Get Approved</h3>
            <p className="mt-2 text-sm text-site-text/60">Our team reviews your application. Once approved, you will receive your portal access and referral code.</p>
          </div>
          <div className="rounded-2xl border border-site-border bg-site-surface-soft p-6 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-400 text-lg font-bold">3</div>
            <h3 className="mt-4 font-semibold">Earn Commissions</h3>
            <p className="mt-2 text-sm text-site-text/60">Refer students using your unique code or register them directly. Earn 10% commission per enrollment.</p>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
          <h2 className="text-2xl font-semibold">Ready to get started?</h2>
          <p className="mt-2 text-site-text/60">Apply now and start earning commissions on every student you refer.</p>
          <Link
            href={applyHref}
            className="mt-6 inline-block rounded-full bg-red-600 px-8 py-3 text-sm font-semibold text-white hover:bg-red-500 transition"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
