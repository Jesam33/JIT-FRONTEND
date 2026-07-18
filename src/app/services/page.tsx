import InnerPageHero from "@/components/layout/InnerPageHero";
import { routeIntros, servicesList } from "@/lib/content";

export default function ServicesPage() {
  const content = routeIntros.services;

  return (
    <section>
      <InnerPageHero title={content.title} subtitle={content.subtitle}>
        <p>{content.body}</p>
      </InnerPageHero>

      <div className="container-wide py-14">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {servicesList.map((service) => (
            <article key={service.title} className="rounded-xl border border-site-border/30 bg-site-surface-soft p-6">
              <h3 className="mb-3 text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                {service.title}
              </h3>
              <p className="text-sm text-site-text/75">{service.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
