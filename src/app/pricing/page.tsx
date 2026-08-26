import Link from "next/link";
import InnerPageHero from "@/components/layout/InnerPageHero";
import { pricingPlans } from "@/lib/content";

export default function PricingPage() {
  return (
    <section>
      <InnerPageHero title="Simple pricing that grows with you" subtitle="FLEXIBLE PRICING PLAN">
        <p>Launch your institute today and upgrade any time — no long-term contracts.</p>
      </InnerPageHero>

      <div className="container-wide py-14">
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
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
              <p className="my-4 text-3xl font-bold display-gradient">{plan.price}</p>
              <ul className="space-y-2 text-sm text-site-text/80">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              <Link
                href={`/signup?plan=${plan.slug}`}
                className="mt-8 inline-flex justify-center rounded-full bg-[#ed180d] px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Choose {plan.name}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
