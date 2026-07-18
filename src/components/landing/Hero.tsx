import Image from "next/image";
import Button from "@/components/ui/Button";
import { heroContent } from "@/lib/content";
import discussions from "../../../public/images/sections/discusssions.png";
import work from "../../../public/images/sections/work.png";

type HeroContent = typeof heroContent;
type HeroProps = { content?: HeroContent };

export default function Hero({ content = heroContent }: HeroProps) {
  return (
    <section className="section-pad section-divider hero-grid">
      <div className="container-wide space-y-12">

        {/* ── Heading ─────────────────────────────────────── */}
        <div className="reveal space-y-6 text-center">
          <p className="inline-flex rounded-[var(--radius-pill)] border border-site-border/30 px-4 py-2 text-xs uppercase tracking-[0.22em] text-site-text/85">
            {content.kicker}
          </p>
          <h1
            className="display-gradient mx-auto max-w-4xl text-5xl font-bold leading-tight md:text-7xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {content.title}
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-8 text-site-text/75">{content.subtitle}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button href="/contact" variant="secondary">{content.ctaPrimary}</Button>
            <Button href="https://www.youtube.com/watch?v=c8aOBRC3tvs" variant="outline">{content.ctaSecondary}</Button>
          </div>
        </div>

        {/* ── Bento grid ──────────────────────────────────── */}
        <div className="grid auto-rows-[180px] gap-3 md:grid-cols-4 lg:grid-cols-6">

          {/* Stat — 25+ Years (2 rows tall) */}
          <div className="reveal relative row-span-2 overflow-hidden rounded-2xl border border-site-border/20 md:col-span-2 lg:col-span-1" style={{ animationDelay: "60ms" }}>
            <Image
              src="/images/sections/showcase-business-experience.jpg"
              alt="Office experience"
              fill
              className="object-cover transition duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="text-5xl font-bold leading-none text-white" style={{ fontFamily: "var(--font-display)" }}>25+</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-white/60">Years Experience</p>
              <p className="mt-3 text-xs leading-5 text-white/55">Trusted delivery with a practical build process for modern products.</p>
            </div>
          </div>

          {/* Web Dev — wide (3 cols × 1 row) */}
          <div className="reveal relative col-span-2 row-span-1 overflow-hidden rounded-2xl border border-site-border/20 md:col-span-2 lg:col-span-3" style={{ animationDelay: "100ms" }}>
            <Image src="/images/sections/web-development.jpg" alt="Web development" fill className="object-cover transition duration-500 hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-white/80">Web Development</p>
            </div>
          </div>

          {/* Stat — 100+ Projects (2 cols × 1 row) */}
          <div className="reveal relative overflow-hidden rounded-2xl border border-site-border/20 md:col-span-2 lg:col-span-2" style={{ animationDelay: "140ms" }}>
            <Image
              src="/images/sections/showcase-client-base.jpg"
              alt="Projects delivered"
              fill
              className="object-cover transition duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="text-5xl font-bold leading-none text-white" style={{ fontFamily: "var(--font-display)" }}>100+</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-white/60">Projects Delivered</p>
            </div>
          </div>

          {/* Mobile App */}
          <div className="reveal relative col-span-2 row-span-1 overflow-hidden rounded-2xl border border-site-border/20 lg:col-span-2" style={{ animationDelay: "180ms" }}>
            <Image src="/images/sections/mobile-app.jpg" alt="Mobile app development" fill className="object-cover transition duration-500 hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-white/80">Mobile App Dev</p>
            </div>
          </div>

          {/* UI/UX */}
          <div className="reveal relative col-span-2 row-span-1 overflow-hidden rounded-2xl border border-site-border/20 md:col-span-2 lg:col-span-2" style={{ animationDelay: "220ms" }}>
            <Image src="/images/sections/ui-ux.jpg" alt="UI UX design" fill className="object-cover transition duration-500 hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-white/80">UI / UX Design</p>
            </div>
          </div>

          {/* Discussions photo (2 rows tall) */}
          <div className="reveal relative row-span-2 overflow-hidden rounded-2xl border border-site-border/20 md:col-span-2 lg:col-span-1" style={{ animationDelay: "260ms" }}>
            <Image src={discussions} alt="Team discussions" fill className="object-cover transition duration-500 hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-white/80">Our Team</p>
            </div>
          </div>

          {/* Work photo — wide */}
          <div className="reveal relative col-span-2 row-span-1 overflow-hidden rounded-2xl border border-site-border/20 md:col-span-2 lg:col-span-3" style={{ animationDelay: "300ms" }}>
            <Image src={work} alt="Team at work" fill className="object-cover transition duration-500 hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-white/80">At Work</p>
            </div>
          </div>

          {/* Tagline tile — with image background */}
          <div className="reveal relative col-span-2 row-span-1 overflow-hidden rounded-2xl border border-site-border/20 md:col-span-2 lg:col-span-2" style={{ animationDelay: "340ms" }}>
            <Image
              src="/images/sections/showcase-customer-retention.jpg"
              alt="Team collaboration"
              fill
              className="object-cover transition duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/55" />
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <p className="text-sm font-semibold leading-6 text-white">
                From concept to deployment — we partner with you every step of the way.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
