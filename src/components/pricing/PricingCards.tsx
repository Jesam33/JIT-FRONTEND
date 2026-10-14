"use client";

// The public pricing page's plan cards with the Monthly / Yearly switch. The
// copy (names, feature bullets) is the static marketing content; the numbers
// come live from /api/plans when it answers, so the yearly price shown is the
// one checkout will charge. Offline it falls back to the static monthly price
// and the default 20% yearly discount (config saas.yearly_discount_percent).

import { useEffect, useState } from "react";
import Link from "next/link";
import { OWNER_API } from "@/lib/api";
import { formatPrice, readCookie } from "@/lib/currency";
import type { PricingPlan } from "@/lib/content";
import type { BillingCycle, Plan } from "@/lib/plans";
import CycleToggle from "@/components/plans/CycleToggle";

const ENTERPRISE_CONTACT = "mailto:contact@jorsastech.com?subject=Enterprise%20plan%20enquiry";
const FALLBACK_DISCOUNT = 20;

export default function PricingCards({ plans }: { plans: PricingPlan[] }) {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [live, setLive] = useState<Record<string, Plan>>({});
  const [discount, setDiscount] = useState(FALLBACK_DISCOUNT);

  useEffect(() => {
    (async () => {
      try {
        // Price the plans for the visitor's country (regional pricing: naira in
        // Nigeria, the dollar price in their own currency elsewhere), the same
        // way the signup page detects it: saved cookie, else location check.
        let country = readCookie("country").toUpperCase();
        if (!country) {
          try {
            const g = await fetch("/api/geo", { cache: "no-store" });
            country = String((await g.json().catch(() => ({})))?.country ?? "").toUpperCase();
          } catch {
            /* unknown: plain naira catalogue */
          }
        }
        const url = country ? `${OWNER_API.plans}?country=${encodeURIComponent(country)}` : OWNER_API.plans;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) return;
        const json = await res.json();
        const list: Plan[] = Array.isArray(json?.plans) ? json.plans : [];
        setLive(Object.fromEntries(list.map((p) => [p.slug, p])));
        const pct = list.find((p) => typeof p.yearly_discount_percent === "number")?.yearly_discount_percent;
        if (typeof pct === "number") setDiscount(pct);
      } catch {
        /* keep the static prices */
      }
    })();
  }, []);

  const priceFor = (plan: PricingPlan): { main: string; note?: string; sub?: string } => {
    const lp = live[plan.slug];
    // The visitor's own currency when the catalogue priced it, else naira.
    const currency = lp?.local_price != null && lp.currency ? lp.currency : "NGN";
    const monthly = currency !== "NGN" ? (lp?.local_price ?? null) : (lp?.price ?? plan.amount);
    if (plan.contactSales || !monthly || monthly <= 0) return { main: plan.price, note: plan.note };
    if (cycle === "monthly") return { main: formatPrice(monthly, currency), note: "/month" };
    const yearly =
      (currency !== "NGN" ? lp?.local_yearly_price : lp?.yearly_price) ?? Math.round(monthly * 12 * (1 - discount / 100));
    return {
      main: formatPrice(yearly, currency),
      note: "/year",
      sub: `${formatPrice(Math.round(yearly / 12), currency)}/month, billed yearly`,
    };
  };

  return (
    <>
      <div className="mb-10 flex justify-center">
        <CycleToggle value={cycle} onChange={setCycle} saveText={discount > 0 ? `Save ${Math.round(discount)}%` : null} />
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const price = priceFor(plan);
          return (
            <article
              key={plan.slug}
              className={`flex flex-col rounded-[20px] border p-8 ${
                plan.popular ? "border-white/40 bg-white/[0.07]" : "border-site-border/30 bg-site-surface-soft"
              }`}
            >
              {plan.popular && (
                <span className="mb-3 inline-block w-fit rounded-full bg-[#ed180d] px-3 py-1 text-xs font-semibold text-[#fff]">
                  Most popular
                </span>
              )}
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="mt-4 mb-1 text-3xl font-bold display-gradient">{price.main}</p>
              {price.note && <p className="text-xs text-site-text/60">{price.note}</p>}
              {price.sub ? <p className="mt-1 text-xs font-medium text-emerald-400">{price.sub}</p> : null}
              <ul className="mt-4 flex-1 space-y-2 text-sm text-site-text/80">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              {plan.contactSales ? (
                <a
                  href={ENTERPRISE_CONTACT}
                  className="mt-6 inline-flex justify-center rounded-full border border-white/40 px-5 py-2 text-sm font-semibold text-site-text transition hover:bg-white/10"
                >
                  Contact sales
                </a>
              ) : (
                <Link
                  href={`/signup?plan=${plan.slug}${cycle === "yearly" && plan.amount ? "&billing=yearly" : ""}`}
                  className="mt-6 inline-flex justify-center rounded-full bg-[#ed180d] px-5 py-2 text-sm font-semibold text-[#fff] transition hover:brightness-110"
                >
                  Choose {plan.name}
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
