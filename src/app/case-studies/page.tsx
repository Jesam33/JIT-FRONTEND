import InnerPageHero from "@/components/layout/InnerPageHero";
import { caseStudiesServices } from "@/lib/content";

export default function CaseStudiesPage() {
  return (
    <section>
      <InnerPageHero title="We can inspire and Offer Different Services" subtitle="WHAT WE DO FOR YOU">
        <p>See all services and capabilities we deliver across strategy, planning, and risk execution.</p>
      </InnerPageHero>

      <div className="container-wide py-14">
        <div className="grid gap-6 md:grid-cols-2">
          {caseStudiesServices.map((service) => (
            <article key={service.title} className="rounded-xl border border-white/20 bg-white/5 p-6">
              <h3 className="mb-3 text-xl font-semibold">{service.title}</h3>
              <p className="text-sm text-white/75">{service.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
