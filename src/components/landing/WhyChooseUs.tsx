import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import discussions from "../../../public/images/sections/discusssions.png";
import work from "../../../public/images/sections/work.png";

const reasons = [
  {
    title: "End-to-End Delivery",
    body: "From discovery and design to development and deployment — we handle every phase with precision and care.",
    image: "/images/sections/web-development.jpg",
  },
  {
    title: "Modern Tech Stack",
    body: "We build with Flutter, Next.js, and scalable cloud platforms so your product is fast, future-proof, and maintainable.",
    image: "/images/sections/mobile-app.jpg",
  },
  {
    title: "Transparent Process",
    body: "Regular updates, clear timelines, and open communication — you always know where your project stands.",
    image: "/images/sections/ui-ux.jpg",
  },
];

const stats = [
  {
    value: "25+",
    label: "Years Experience",
    image: "/images/sections/showcase-business-experience.jpg",
  },
  {
    value: "100+",
    label: "Projects Delivered",
    image: "/images/sections/showcase-client-base.jpg",
  },
  {
    value: "120+",
    label: "Happy Clients",
    image: "/images/sections/api.jpg",
  },
  {
    value: "80%",
    label: "Repeat Business",
    image: "/images/sections/showcase-customer-retention.jpg",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="section-pad section-divider">
      <div className="container-wide space-y-10">
        <SectionHeading
          title="Why businesses trust Jorsas"
          subtitle="WHY CHOOSE US"
          centered
        />

        {/* ── Bento grid ────────────────────────────────────── */}
        <div className="grid auto-rows-[180px] gap-3 md:grid-cols-4 lg:grid-cols-6">

          {/* Large photo tile — discussions (2 cols × 2 rows) */}
          <div className="reveal relative col-span-2 row-span-2 overflow-hidden rounded-2xl border border-site-border/20 lg:col-span-2">
            <Image src={discussions} alt="Jorsas team" fill className="object-cover transition duration-700 hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Our Team</p>
              <p className="mt-1 text-lg font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                People-first culture, world-class results.
              </p>
            </div>
          </div>

          {/* Reason tiles — all 3 with image backgrounds */}
          {reasons.map((r, i) => (
            <div
              key={r.title}
              className="reveal relative col-span-2 row-span-1 overflow-hidden rounded-2xl border border-site-border/20 lg:col-span-2"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <Image src={r.image} alt={r.title} fill className="object-cover transition duration-700 hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="text-base font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                  {r.title}
                </h3>
                <p className="mt-1 text-xs leading-5 text-white/65 line-clamp-2">{r.body}</p>
              </div>
            </div>
          ))}

          {/* Work photo tile — wide */}
          <div className="reveal relative col-span-2 row-span-1 overflow-hidden rounded-2xl border border-site-border/20 md:col-span-2 lg:col-span-2">
            <Image src={work} alt="Working at Jorsas" fill className="object-cover transition duration-700 hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-white/80">Delivering Excellence</p>
            </div>
          </div>

          {/* Four stat tiles — each with its own image */}
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="reveal relative col-span-2 row-span-1 overflow-hidden rounded-2xl border border-site-border/20 md:col-span-2 lg:col-span-1"
              style={{ animationDelay: `${(i + 4) * 70}ms` }}
            >
              <Image src={s.image} alt={s.label} fill className="object-cover transition duration-700 hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-3xl font-bold leading-none text-white" style={{ fontFamily: "var(--font-display)" }}>
                  {s.value}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/60">{s.label}</p>
              </div>
            </div>
          ))}

          {/* Tagline tile — with image */}
          <div
            className="reveal relative col-span-2 row-span-1 overflow-hidden rounded-2xl border border-site-border/20 md:col-span-2 lg:col-span-2"
            style={{ animationDelay: "420ms" }}
          >
            <Image
              src="/images/sections/showcase-business-experience.jpg"
              alt="Modern office"
              fill
              className="object-cover transition duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/55" />
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <p className="text-sm font-semibold leading-6 text-white">
                Trusted by startups and enterprises across{" "}
                <span className="text-[#2e82b5]">real estate, fintech, education &amp; health tech.</span>
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
