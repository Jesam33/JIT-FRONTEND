import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InnerPageHero from "@/components/layout/InnerPageHero";
import { blogPreview } from "@/lib/content";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPreview.find((entry) => entry.slug === slug);

  if (!post) {
    return { title: "Not Found" };
  }

  return {
    title: `${post.title} | Jorsas Tech`,
    description: post.description,
  };
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  const post = blogPreview.find((entry) => entry.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <section>
      <InnerPageHero title={post.title} subtitle="Blog Article">
        <p>{post.description}</p>
      </InnerPageHero>
      <div className="container-wide py-12">
        <article className="rounded-xl border border-white/20 bg-white/5 p-8 text-sm leading-7 text-white/85">
          This article content is mapped to the exact title and summary from the live site.
        </article>
      </div>
    </section>
  );
}
