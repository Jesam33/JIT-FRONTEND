import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InnerPageHero from "@/components/layout/InnerPageHero";
import { portfolioItems } from "@/lib/content";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = portfolioItems.find((entry) => entry.slug === slug);

  if (!item) {
    return { title: "Not Found" };
  }

  return {
    title: `${item.title} | Portfolio | Jorsas Tech`,
    description: item.summary,
  };
}

export default async function PortfolioDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = portfolioItems.find((entry) => entry.slug === slug);

  if (!item) {
    notFound();
  }

  return (
    <section>
      <InnerPageHero title={item.title} subtitle={item.category}>
        <p>{item.summary}</p>
      </InnerPageHero>

      <div className="container-wide py-12">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-xl border border-white/20 bg-white/5 p-6 md:p-8">
            <div
              className="mb-7 h-64 rounded-xl border border-white/10 bg-cover bg-center md:h-80"
              style={{ backgroundImage: `url(${item.image})` }}
              role="img"
              aria-label={item.title}
            />
            <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              {item.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/85">{item.body}</p>
          </article>

          <aside className="h-fit rounded-xl border border-white/20 bg-white/5 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/80">Project Information</h3>
            <dl className="mt-4 space-y-3 text-sm text-white/85">
              <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
                <dt className="text-white/65">Client</dt>
                <dd className="text-right">{item.client}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
                <dt className="text-white/65">Date</dt>
                <dd className="text-right">{item.date}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
                <dt className="text-white/65">Author</dt>
                <dd className="text-right">{item.author}</dd>
              </div>
              <div className="flex justify-between gap-4 pb-1">
                <dt className="text-white/65">Category</dt>
                <dd className="text-right">{item.category}</dd>
              </div>
            </dl>
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex text-xs font-semibold uppercase tracking-[0.16em] text-white/80 underline underline-offset-4"
            >
              View Live Project
            </a>
          </aside>
        </div>
      </div>
    </section>
  );
}
