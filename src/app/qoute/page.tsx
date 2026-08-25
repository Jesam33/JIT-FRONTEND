import InnerPageHero from "@/components/layout/InnerPageHero";
import QuoteRequestForm from "@/components/QuoteRequestForm";

export default function QoutePage() {
  return (
    <section>
      <InnerPageHero title="Request a Quote" subtitle="Get In Touch">
        <p>Share your project details and we will provide a scoped estimate.</p>
      </InnerPageHero>

      <div className="container-wide py-14">
        <div className="mx-auto max-w-3xl rounded-xl border border-white/20 bg-white/5 p-6 md:p-10">
          <QuoteRequestForm />
        </div>
      </div>
    </section>
  );
}
