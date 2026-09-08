"use client";

// The BODY of a plan card (name, price, tagline, commission, limits, full
// feature checklist), shared verbatim by the billing portal carousel
// (/lms/admin/billing) and the signup "Choose your plan" grid (/signup) so the
// two surfaces can never drift apart again. Each page keeps its own wrapper
// (billing: carousel card with badges + CTA; signup: a selectable button with
// its own select indicator) and renders this inside.

import { FEATURE_LABELS, TAGLINES, isContactSalesPlan, limitSummary, priceText, type Features, type Plan } from "@/lib/plans";

export default function PlanCardBody({ plan }: { plan: Plan }) {
  const isContact = isContactSalesPlan(plan);
  const isPaid = !isContact && (plan.price ?? 0) > 0;
  const features = plan.features;

  return (
    <>
      <div className="text-sm uppercase tracking-wide text-site-muted">{plan.name}</div>
      <div className="mt-2 text-3xl font-semibold text-white">{priceText(plan)}</div>
      <div className="text-xs text-site-muted">
        {isContact ? "tailored to you" : isPaid ? "per month" : "forever"}
      </div>

      {TAGLINES[plan.slug] ? <p className="mt-3 text-xs text-site-muted">{TAGLINES[plan.slug]}</p> : null}

      {typeof plan.commission_percent === "number" ? (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/80">
          <span className="font-semibold text-white">{plan.commission_percent}%</span> platform fee on course sales
        </div>
      ) : null}

      {plan.limits ? <div className="mt-3 text-xs text-site-muted">{limitSummary(plan.limits)}</div> : null}

      {features ? (
        <ul className="mt-4 space-y-2 text-sm">
          {(Object.keys(FEATURE_LABELS) as (keyof Features)[]).map((key) => {
            const on = features[key];
            return (
              <li key={key} className={`flex items-center gap-2 ${on ? "text-white/85" : "text-site-muted"}`}>
                <span className={on ? "text-emerald-400" : "text-white/30"}>{on ? "✓" : "—"}</span>
                <span className={on ? "" : "opacity-70"}>{FEATURE_LABELS[key]}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </>
  );
}
