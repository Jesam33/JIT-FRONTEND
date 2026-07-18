import InnerPageHero from "@/components/layout/InnerPageHero";
import { testimonials } from "@/lib/content";

export default function TestimonialsPage() {
  return (
    <section>
      <InnerPageHero title="Testimonials" subtitle="Client Feedback">
        <p>Feedback highlights from Jorsas Tech projects and consulting engagements.</p>
      </InnerPageHero>

      <div className="container-wide py-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((item) => (
          <article key={item.title} className="rounded-xl border border-site-border/30 bg-site-surface-soft p-6">
            <h3 className="mb-3 text-xl font-semibold">{item.title}</h3>
            <p className="mb-4 text-sm text-site-text/75">{item.body}</p>
            <p className="text-xs text-site-text/70">{item.author}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
