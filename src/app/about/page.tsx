import InnerPageHero from "@/components/layout/InnerPageHero";
import { aboutCoreFeatures, routeIntros } from "@/lib/content";

export default function AboutPage() {
  const content = routeIntros.about;

  return (
    <section>
      <InnerPageHero title={content.title} subtitle={content.subtitle}>
        <p>{content.body}</p>
      </InnerPageHero>

      <div className="container-wide py-14">
        <h2 className="mb-8 text-3xl font-bold display-gradient" style={{ fontFamily: "var(--font-display)" }}>
          Amazing Features For Business Solutions
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {aboutCoreFeatures.map((item) => (
            <article key={item.title} className="rounded-xl border border-site-border/30 bg-site-surface-soft p-6">
              <h3 className="mb-3 text-xl font-semibold">{item.title}</h3>
              <p className="text-sm text-site-text/75">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
