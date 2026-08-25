import Link from "next/link";
import Image from "next/image";
import trainingBanner from "../../../public/images/training/trainingBanner.png"

export default function TrainingInstituteBanner() {
  return (
    <section className="section-pad section-divider">
      <div className="container-wide">
        <div className="reveal overflow-hidden rounded-[24px] border border-site-border/30 bg-site-surface-soft">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8 md:p-12">
              <p className="text-xs uppercase tracking-[0.18em] text-site-text/70">Training Institute</p>
              <h2 className="mt-4 text-3xl font-bold md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
                Jorsas Institute Of Technology
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-site-text/75">
                Join practical, career-focused programs taught by experienced instructors. Learn with structured
                classes, guided materials, and mentorship that helps you move from beginner to confident professional.
              </p>
              <div className="mt-8">
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/institute"
                      className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold !text-white transition hover:bg-red-500"
                    >
                      View Courses
                      <span aria-hidden="true">↗</span>
                    </Link>

                    <Link
                      href="/signup"
                      className="inline-flex  items-center gap-2 rounded-full border border-white/10 bg-transparent px-6 py-3 text-sm font-semibold text-site-text transition hover:bg-white/5"
                    >
                      Register Your Institute
                    </Link>
                  </div>
              </div>
            </div>

            <div className="relative min-h-72 lg:min-h-full">
              <Image
                src={trainingBanner}
                alt="Training institute students learning together"
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
