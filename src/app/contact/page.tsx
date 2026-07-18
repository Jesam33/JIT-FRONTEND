import InnerPageHero from "@/components/layout/InnerPageHero";
import { routeIntros } from "@/lib/content";

export default function ContactPage() {
  const content = routeIntros.contact;

  return (
    <section>
      <InnerPageHero title={content.title} subtitle={content.subtitle}>
        <p>{content.body}</p>
      </InnerPageHero>

      <div className="container-wide py-14">
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-xl border border-white/20 bg-white/5 p-6">
            <h3 className="mb-3 text-xl font-semibold">USA Office</h3>
            <p className="text-sm text-white/75">100 Wilshire Blvd, Suite 700 Santa Monica, CA 90401, USA</p>
            <p className="mt-2 text-sm text-white/85">+1 (310) 620-8565</p>
            <p className="text-sm text-white/85">info@gmail.com</p>
          </article>
          <article className="rounded-xl border border-white/20 bg-white/5 p-6">
            <h3 className="mb-3 text-xl font-semibold">Australia Office</h3>
            <p className="text-sm text-white/75">100 Wilshire Blvd, Suite 700 Santa Monica, CA 90401, USA</p>
            <p className="mt-2 text-sm text-white/85">+1 (310) 620-8565</p>
            <p className="text-sm text-white/85">info@gmail.com</p>
          </article>
        </div>
      </div>
    </section>
  );
}
