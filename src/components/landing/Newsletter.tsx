import Button from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";

export default function Newsletter() {
  return (
    <section className="section-pad section-divider">
      <div className="container-wide">
        <div className="rounded-[var(--radius-card)] border border-site-border/30 bg-site-surface-soft p-8 md:p-12 reveal">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <SectionHeading
                title="Our Newsletters"
                subtitle="Signup to our newsletters"
              />
              <p className="mt-4 max-w-2xl text-site-text/75">
                Stay in the Loop: Sign Up for Our Newsletter!
              </p>
            </div>
            <div className="flex flex-wrap gap-4 lg:justify-end">
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
