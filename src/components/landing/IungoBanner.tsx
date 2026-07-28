import Link from "next/link";
import Image from "next/image";

export default function IungoBanner() {
  return (
    <section className="section-pad">
      <div className="container-wide">
        <div className="reveal relative overflow-hidden rounded-[24px]">
          {/* Background */}
          <Image
            src="/images/iungo-banner.png"
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1320px) 92vw, 1320px"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/50 [html.light_&]:from-white/90 [html.light_&]:via-white/75 [html.light_&]:to-white/50" />

          {/* Red accent bar */}
          <div className="absolute left-0 top-0 z-10 h-full w-1.5 bg-site-primary" />

          <div className="relative z-10 px-6 py-10 md:px-14 md:py-14 lg:px-20">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-4 flex items-center gap-3">
                  <Image
                    src="/images/iungo-white.png"
                    alt="IUNGO"
                    width={36}
                    height={36}
                    className="block h-9 w-auto [html.light_&]:hidden"
                  />
                  <Image
                    src="/images/iungo-dark.png"
                    alt="IUNGO"
                    width={36}
                    height={36}
                    className="hidden h-9 w-auto [html.light_&]:block"
                  />
                  <span className="text-sm font-semibold uppercase tracking-[0.15em] text-site-primary">IUNGO</span>
                </div>

                <h2 className="text-3xl font-bold leading-tight md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
                  Official Creators <br />
                  <span className="text-site-primary">of IUNGO</span>
                </h2>

                <p className="mt-4 max-w-xl text-base leading-7 text-site-text/70 md:text-lg">
                  We built IUNGO — a talk-to-earn platform where your voice becomes your wealth.
                  Set your rate, share your insights, and get paid for every conversation.
                </p>

                <div className="mt-7 flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-site-primary/20 text-xs font-bold text-site-primary">1</span>
                    <span className="text-sm text-site-text/80">Create your profile</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-site-primary/20 text-xs font-bold text-site-primary">2</span>
                    <span className="text-sm text-site-text/80">Set your rate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-site-primary/20 text-xs font-bold text-site-primary">3</span>
                    <span className="text-sm text-site-text/80">Start earning</span>
                  </div>
                </div>

                <div className="mt-8">
                  <Link
                    href="https://www.iungo.app"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-site-primary px-7 py-3.5 text-sm font-semibold !text-white shadow-lg shadow-site-primary/25 transition hover:brightness-110 hover:shadow-xl hover:shadow-site-primary/30"
                  >
                    Get Started on IUNGO
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                  </Link>
                </div>
              </div>

              <div className="shrink-0">
                <Image
                  src="/images/iungo-flyer.jpeg"
                  alt="IUNGO Flyer"
                  width={360}
                  height={450}
                  className="h-auto w-[280px] rounded-2xl object-cover shadow-2xl md:w-[360px]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
