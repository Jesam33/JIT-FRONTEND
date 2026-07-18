import type { ReactNode } from "react";
import SectionHeading from "@/components/ui/SectionHeading";

type InnerPageHeroProps = {
  title: string;
  subtitle: string;
  children?: ReactNode;
};

export default function InnerPageHero({ title, subtitle, children }: InnerPageHeroProps) {
  return (
    <section className="section-pad border-b border-site-border/30">
      <div className="container-wide space-y-6">
        <SectionHeading title={title} subtitle={subtitle} />
        {children ? <div className="max-w-3xl text-site-text/75">{children}</div> : null}
      </div>
    </section>
  );
}
