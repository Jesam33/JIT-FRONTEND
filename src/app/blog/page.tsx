import Link from "next/link";
import InnerPageHero from "@/components/layout/InnerPageHero";
import { blogPreview } from "@/lib/content";

export default function BlogPage() {
  return (
    <section>
      <InnerPageHero title="Blog" subtitle="Latest News">
        <p>Insights, strategy notes, and practical guides from our consulting and technology work.</p>
      </InnerPageHero>
      <div className="container-wide py-14">
        <div className="grid gap-6 md:grid-cols-2">
          {blogPreview.map((post) => (
            <article key={post.slug} className="rounded-xl border border-white/15 bg-white/5 p-6">
              <h3 className="mb-3 text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                {post.title}
              </h3>
              <p className="mb-6 text-sm text-white/75">{post.description}</p>
              <Link href={`/${post.slug}`} className="text-sm font-semibold text-white underline-offset-4 hover:underline">
                Read More
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
