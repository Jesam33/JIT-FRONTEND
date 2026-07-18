import Image from "next/image";
import Link from "next/link";
import { sponsors } from "@/lib/content";
import type { Sponsor } from "@/lib/content";

type SponsorsProps = {
  items?: Sponsor[];
};

export default function Sponsors({ items = sponsors }: SponsorsProps) {
  const logoClassName = (name: string) =>
    name === "Payitmonthly"
      ? "mx-auto block h-12 w-auto object-contain opacity-95"
      : "mx-auto block h-12 w-auto object-contain grayscale brightness-0 invert [html.light_&]:invert-0 opacity-75";

  return (
    <section className="pb-14 pt-6 md:pb-16 md:pt-8">
      <div className="container-wide">
        <div className="reveal rounded-[20px] border border-site-border/30 bg-site-surface-soft px-5 py-8 md:px-8 md:py-9">
          <h2 className="text-center text-lg font-semibold text-site-text/90 md:text-xl" style={{ fontFamily: "var(--font-display)" }}>
            Trusted by 10,000+ companies around the world
          </h2>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((sponsor) => (
              <div
                key={sponsor.name}
                className="flex min-h-20 items-center justify-center rounded-xl border border-site-border/20 bg-site-surface px-4 py-3"
              >
                {sponsor.href ? (
                  <Link
                    href={sponsor.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-full w-full items-center justify-center"
                  >
                    <Image
                      src={sponsor.logo as string}
                      alt={sponsor.name}
                      width={220}
                      height={72}
                      className={logoClassName(sponsor.name)}
                    />
                  </Link>
                ) : (
                  <Image
                    src={sponsor.logo as string}
                    alt={sponsor.name}
                    width={220}
                    height={72}
                    className={logoClassName(sponsor.name)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
