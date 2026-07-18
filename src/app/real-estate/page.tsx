import InnerPageHero from "@/components/layout/InnerPageHero";
import { realEstateContent } from "@/lib/content";

export default function RealEstatePage() {
  return (
    <section>
      <InnerPageHero title={realEstateContent.title} subtitle="Real Estate">
        <p>{realEstateContent.intro}</p>
      </InnerPageHero>

      <div className="container-wide py-14 space-y-10">
        <section className="rounded-xl border border-site-border/30 bg-site-surface-soft p-6">
          <h2 className="mb-3 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            {realEstateContent.whyTitle}
          </h2>
          <p className="text-sm text-site-text/80">{realEstateContent.whyBody}</p>
        </section>

        <section className="rounded-xl border border-site-border/30 bg-site-surface-soft p-6">
          <h2 className="mb-3 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            {realEstateContent.contactTitle}
          </h2>
          <p className="text-sm text-site-text/80">{realEstateContent.contactBody}</p>
        </section>
      </div>
    </section>
  );
}
