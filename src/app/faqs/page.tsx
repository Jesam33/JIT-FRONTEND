import InnerPageHero from "@/components/layout/InnerPageHero";
import { faqGroups } from "@/lib/content";

export default function FaqsPage() {
  return (
    <section>
      <InnerPageHero title="FAQs" subtitle="Support">
        <p>Frequently asked questions grouped exactly as on the live site.</p>
      </InnerPageHero>

      <div className="container-wide py-14 space-y-10">
        {faqGroups.map((group) => (
          <section key={group.title}>
            <h3 className="mb-5 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>{group.title}</h3>
            <div className="space-y-3">
              {group.questions.map((question) => (
                <article key={question} className="rounded-xl border border-site-border/30 bg-site-surface-soft px-5 py-4 text-sm text-site-text">
                  {question}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
