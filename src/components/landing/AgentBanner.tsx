import Link from "next/link";
import Image from "next/image";
import agentBanner from "../../../public/images/sections/work.png"

// `tenantSlug` scopes the CTA to a specific academy's agent program
// (/become-an-agent?tenant={slug}), so a visitor who applies from an academy's
// storefront is onboarded as THAT academy's agent. Absent (the apex Jorsas
// /institute banner) it links to the plain primary program, unchanged.
export default function AgentBanner({ tenantSlug }: { tenantSlug?: string }) {
  const applyHref = tenantSlug
    ? `/become-an-agent?tenant=${encodeURIComponent(tenantSlug)}`
    : "/become-an-agent";
  return (
    <section className="section-pad section-divider">
      <div className="container-wide">
        <div className="reveal overflow-hidden rounded-[24px] border border-site-border/30 bg-site-surface-soft">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8 md:p-12">
              <p className="text-xs uppercase tracking-[0.18em] text-site-text/70">Become an Admission Marketer</p>
              <h2 className="mt-4 text-3xl font-bold md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
                Earn 10% Commission
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-site-text/75">
                Refer students to our courses and earn 10% commission on every enrollment.
                Your students get 5% off too. Join our Admission-Marketer network and start earning today.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href={applyHref}
                  className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold !text-white transition hover:bg-red-500"
                >
                  Apply Now
                  <span aria-hidden="true">↗</span>
                </Link>
                <Link
                  href={applyHref}
                  className="inline-flex items-center gap-2 rounded-full border border-site-border/30 px-6 py-3 text-sm font-semibold text-site-text transition hover:bg-site-surface"
                >
                  Learn More
                </Link>
              </div>
            </div>

            <div className="relative min-h-72 lg:min-h-full">
              <Image
                src={agentBanner}
                alt="Become an admission marketer partner"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
