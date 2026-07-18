import Link from "next/link";
import Image from "next/image";
import agentBanner from "../../../public/images/sections/work.png"

export default function AgentBanner() {
  return (
    <section className="section-pad section-divider">
      <div className="container-wide">
        <div className="reveal overflow-hidden rounded-[24px] border border-site-border/30 bg-site-surface-soft">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8 md:p-12">
              <p className="text-xs uppercase tracking-[0.18em] text-site-text/70">Become an Agent</p>
              <h2 className="mt-4 text-3xl font-bold md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
                Earn 10% Commission
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-site-text/75">
                Refer students to our courses and earn 10% commission on every enrollment. 
                Your students get 5% off too. Join our agent program and start earning today.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/become-an-agent"
                  className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold !text-white transition hover:bg-red-500"
                >
                  Apply Now
                  <span aria-hidden="true">↗</span>
                </Link>
                <Link
                  href="/become-an-agent"
                  className="inline-flex items-center gap-2 rounded-full border border-site-border/30 px-6 py-3 text-sm font-semibold text-site-text transition hover:bg-site-surface"
                >
                  Learn More
                </Link>
              </div>
            </div>

            <div className="relative min-h-72 lg:min-h-full">
              <Image
                src={agentBanner}
                alt="Become an agent partner"
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
