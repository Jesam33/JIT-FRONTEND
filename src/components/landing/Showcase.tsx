import Image from "next/image";
import Button from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";
import { showcase } from "@/lib/content";
import type { ShowcaseItem } from "@/lib/content";

type ShowcaseProps = {
  items?: ShowcaseItem[];
};

export default function Showcase({ items = showcase }: ShowcaseProps) {
  return (
    <section className="section-pad section-divider">
      <div className="container-wide space-y-10">
        <div className="reveal rounded-[24px] border border-site-border/30 bg-[radial-gradient(circle_at_50%_50%,rgba(46,130,181,0.42),rgba(46,130,181,0)_62%)] px-5 py-14 md:px-10">
          <SectionHeading title="We are the next gen Business experience" subtitle="GET TO KNOW US" centered />
          <p className="mx-auto mt-5 max-w-3xl text-center text-site-text/75">
            Each track uses the same design language and component variants to keep the implementation consistent across all routes.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {items.map((item, index) => (
            <article key={item.title} className="reveal overflow-hidden rounded-[var(--radius-card)] border border-site-border/30 bg-site-surface-soft" style={{ animationDelay: `${index * 90}ms` }}>
              <div className="relative h-56 overflow-hidden border-b border-site-border/30">
                <Image src={item.image} alt={item.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/35" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-lg font-semibold text-white">
                  {item.title}
                </div>
              </div>
              <div className="p-4 text-site-text/80">
                <p className="min-h-20 text-sm leading-6">{item.text}</p>
                <div className="mt-6">
                  <Button href="/services" variant="secondary">
                    Learn More
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
