import Button from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";

export default function Newsletter() {
  return (
    <section className="section-pad section-divider">
      <div className="container-wide">
        <div className="rounded-[var(--radius-card)] border border-site-border/30 bg-site-surface-soft p-6 md:p-12 reveal">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <SectionHeading
                title="Our Newsletters"
                subtitle="Signup to our newsletters"
              />
              <p className="mt-4 max-w-2xl text-sm text-site-text/75 md:text-base">
                Stay in the Loop: Sign Up for Our Newsletter!
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row lg:justify-end">
              <Button href="/contact" variant="primary">
                Subscribe
              </Button>
              <Button href="/pricing" variant="outline">
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
