import Image from "next/image";
import Button from "@/components/ui/Button";
import { heroContent } from "@/lib/content";

type HeroContent = typeof heroContent;
type HeroProps = { content?: HeroContent };

type SlideData = {
  image: string;
  stat?: string;
  statLabel?: string;
  label?: string;
  description?: string;
};

const slides: SlideData[] = [
  {
    image: "/images/sections/code-3.png",
    stat: "25+",
    statLabel: "Years Experience",
    description: "Trusted delivery with a practical build process for modern products.",
  },
  
  {
    image: "/images/sections/code-2.png",
    stat: "100+",
    statLabel: "Projects Delivered",
  },
  {
    image: "/images/sections/code-4.png",
    label: "Web Development",
  },
  
];

export default function Hero({ content = heroContent }: HeroProps) {
  return (
    <section className="section-pad section-divider hero-grid">
      <div className="container-wide space-y-6">

        {/* ── Heading ─────────────────────────────────────── */}
        <div className="reveal space-y-6 text-center">
          <p className="inline-flex rounded-[var(--radius-pill)] border border-site-border/30 px-4 py-2 text-xs uppercase tracking-[0.22em] text-site-text/85">
            {content.kicker}
          </p>
          <h1
            className="display-gradient mx-auto max-w-full text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-7xl lg:text-8xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {content.title}
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-site-text/75 sm:text-base md:text-lg md:leading-8">{content.subtitle}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button href="/qoute" variant="primary">{content.ctaPrimary}</Button>
            <Button href="/institute" variant="light">{content.ctaSecondary}</Button>
          </div>
        </div>

        {/* ── Image grid ─────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slides.map((slide, i) => (
            <div key={i} className="relative h-[240px] overflow-hidden rounded-2xl border border-site-border/20 group/card md:h-[260px]">
              <Image
                src={slide.image}
                alt={slide.label ?? slide.statLabel ?? ""}
                fill
                className="object-cover transition duration-500 group-hover/card:scale-105"
              />
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-black/70 translate-y-full group-hover/card:translate-y-0 transition-transform duration-300 ease-out" />
<div className="absolute inset-0 flex items-center justify-center p-4 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 delay-150">
                  <div className="text-center" style={{ color: '#fff' }}>
                    {slide.stat && (
                      <>
                        <p className="text-3xl font-bold leading-none md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
                          {slide.stat}
                        </p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest">
                          {slide.statLabel}
                        </p>
                      </>
                    )}
                    {slide.label && !slide.stat && (
                      <p className="text-sm font-bold md:text-base" style={{ fontFamily: "var(--font-display)" }}>
                        {slide.label}
                      </p>
                    )}
                    {slide.description && (
                      <p className="mt-1 max-w-md text-[11px] leading-4 md:text-xs">
                        {slide.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
