import InnerPageHero from "@/components/layout/InnerPageHero";
import { pricingPlans } from "@/lib/content";

export default function PricingPage() {
  return (
    <section>
      <InnerPageHero title="We've offered the best pricing for you" subtitle="FLEXIBLE PRICING PLAN">
        <p>Ever Find Yourself Staring At Your Computer Screen A Good Consulting Slogan To Come To Mind? Oftentimes.</p>
      </InnerPageHero>

      <div className="container-wide py-14">
        <div className="grid gap-6 md:grid-cols-3">
          {pricingPlans.map((plan) => (
            <article key={plan.name} className="rounded-xl border border-site-border/30 bg-site-surface-soft p-6">
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="my-4 text-3xl font-bold display-gradient">{plan.price}</p>
              <ul className="space-y-2 text-sm text-site-text/80">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
