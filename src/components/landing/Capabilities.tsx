import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import { capabilities } from "@/lib/content";
import type { Capability } from "@/lib/content";

type CapabilitiesProps = {
  items?: Capability[];
};

export default function Capabilities({ items = capabilities }: CapabilitiesProps) {
  const [webDev, mobileApp, uiUx, apiDev] = items;

  return (
    <section className="section-pad section-divider">
      <div className="container-wide space-y-10">
        <SectionHeading
          title="The features that make our Service unique"
          subtitle="WHAT WE DO FOR YOU"
          centered
        />

        {/* Bento grid — asymmetric 4-col layout, every tile has an image */}
        <div className="grid auto-rows-[220px] gap-3 md:grid-cols-4">

          {/* Web Dev — large hero tile (2 cols × 2 rows) */}
          {webDev && (
            <article
              className="reveal relative col-span-2 row-span-2 overflow-hidden rounded-2xl border border-site-border/20"
              style={{ animationDelay: "0ms" }}
            >
              <Image src={webDev.image} alt={webDev.title} fill className="object-cover transition duration-700 hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/60">01</p>
                <h3 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                  {webDev.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/75">{webDev.description}</p>
              </div>
            </article>
          )}

          {/* Mobile App — image tile (1 col × 1 row) */}
          {mobileApp && (
            <article
              className="reveal relative col-span-2 row-span-1 overflow-hidden rounded-2xl border border-site-border/20 md:col-span-1"
              style={{ animationDelay: "70ms" }}
            >
              <Image src={mobileApp.image} alt={mobileApp.title} fill className="object-cover transition duration-700 hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/60">02</p>
                <h3 className="text-base font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                  {mobileApp.title}
                </h3>
              </div>
            </article>
          )}

          {/* UI/UX — image tile (1 col × 1 row) */}
          {uiUx && (
            <article
              className="reveal relative col-span-2 row-span-1 overflow-hidden rounded-2xl border border-site-border/20 md:col-span-1"
              style={{ animationDelay: "140ms" }}
            >
              <Image src={uiUx.image} alt={uiUx.title} fill className="object-cover transition duration-700 hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/60">03</p>
                <h3 className="text-base font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                  {uiUx.title}
                </h3>
              </div>
            </article>
          )}

          {/* API Dev — image tile (1 col × 1 row) */}
          {apiDev && (
            <article
              className="reveal relative col-span-2 row-span-1 overflow-hidden rounded-2xl border border-site-border/20 md:col-span-1"
              style={{ animationDelay: "210ms" }}
            >
              <Image
                src="/images/sections/api.jpg"
                alt={apiDev.title}
                fill
                className="object-cover transition duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/60">04</p>
                <h3 className="text-base font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                  {apiDev.title}
                </h3>
                <p className="mt-1 text-xs leading-4 text-white/65 line-clamp-2">{apiDev.description}</p>
              </div>
            </article>
          )}

          {/* Accent stat tile — "4+ Core Services" with image (1 col × 1 row) */}
          <div
            className="reveal relative col-span-2 row-span-1 overflow-hidden rounded-2xl border border-site-border/20 md:col-span-1"
            style={{ animationDelay: "280ms" }}
          >
            <Image
              src="/images/sections/work.png"
              alt="Core services"
              fill
              className="object-cover transition duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-center">
              <p className="text-4xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>4+</p>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-white/60">Core Services</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
