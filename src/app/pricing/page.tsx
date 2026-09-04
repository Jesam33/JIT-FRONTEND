import Link from "next/link";
import InnerPageHero from "@/components/layout/InnerPageHero";
import { pricingPlans } from "@/lib/content";

// Enterprise is a contact-sales tier (never a self-serve checkout) — the CTA
// opens a pre-addressed enquiry to the same address the site uses elsewhere.
const ENTERPRISE_CONTACT = "mailto:contact@jorsastech.com?subject=Enterprise%20plan%20enquiry";

export default function PricingPage() {
  return (
    <section>
      <InnerPageHero title="Simple pricing that grows with you" subtitle="FLEXIBLE PRICING PLAN">
        <p>
          Launch your Online Academy today and upgrade any time, no long-term contracts. Live classes come on
          every plan.
        </p>
      </InnerPageHero>

      <div className="container-wide py-14">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-4">
          {pricingPlans.map((plan) => (
            <article
              key={plan.slug}
              className={`flex flex-col rounded-[20px] border p-8 ${
                plan.popular ? "border-white/40 bg-white/[0.07]" : "border-site-border/30 bg-site-surface-soft"
              }`}
            >
              {plan.popular && (
                <span className="mb-3 inline-block w-fit rounded-full bg-[#ed180d] px-3 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="mt-4 mb-1 text-3xl font-bold display-gradient">{plan.price}</p>
              {plan.note && <p className="mb-4 text-xs text-site-text/60">{plan.note}</p>}
              <ul className="flex-1 space-y-2 text-sm text-site-text/80">
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
                  href={`/signup?plan=${plan.slug}`}
                  className="mt-6 inline-flex justify-center rounded-full bg-[#ed180d] px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Choose {plan.name}
                </Link>
              )}
            </article>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-site-text/60">
          The applicable platform fee is deducted from each eligible successful course sale, never an upfront
          charge. Prices are in Naira, billed monthly, and you can change plans any time.
        </p>
      </div>
    </section>
  );
}
