import Link from "next/link";
import InnerPageHero from "@/components/layout/InnerPageHero";
import { portfolioItems } from "@/lib/content";

export default function PortfolioPage() {
  return (
    <section>
      <InnerPageHero title="Portfolio" subtitle="Projects">
        <p>Selected project highlights from Jorsas Tech delivery work.</p>
      </InnerPageHero>

      <div className="container-wide py-14">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {portfolioItems.map((item) => (
            <Link
              key={item.slug}
              href={`/projects/${item.slug}`}
              className="group rounded-xl border border-site-border/30 bg-site-surface-soft p-6 transition hover:border-site-border/60 hover:bg-site-surface"
            >
              <article>
                <div
                  className="mb-4 h-36 rounded-lg border border-site-border/20 bg-cover bg-center"
                  style={{ backgroundImage: `url(${item.image})` }}
                  role="img"
                  aria-label={item.title}
                />
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm text-site-text/75">{item.summary}</p>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-site-text/80 group-hover:text-site-text">
                  View Project
                </p>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
