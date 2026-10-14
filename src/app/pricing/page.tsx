import InnerPageHero from "@/components/layout/InnerPageHero";
import PricingCards from "@/components/pricing/PricingCards";
import { pricingPlans } from "@/lib/content";

// The cards (with the Monthly / Yearly switch) are a client component; this
// page stays a server component for the hero and copy.
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
        <PricingCards plans={pricingPlans} />
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-site-text/60">
          The applicable platform fee is deducted from each eligible successful course sale, never an upfront
          charge. Pay monthly, or yearly and save, and change plans any time.
        </p>
      </div>
    </section>
  );
}
