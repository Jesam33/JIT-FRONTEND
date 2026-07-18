import SectionHeading from "@/components/ui/SectionHeading";
import { testimonials } from "@/lib/content";

export default function Testimonials() {
  return (
    <section className="section-pad section-divider">
      <div className="container-wide space-y-10">
        <SectionHeading title="Let's Request a Schedule For Free Consultation" subtitle="Call For More Info" centered={true} />
        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <article
              key={item.title}
              className="reveal rounded-xl bg-white p-8 text-black shadow-[4px_4px_25px_5px_rgba(0,0,0,0.12)]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <p className="mb-5 text-4xl text-black/20">“</p>
              <h3 className="mb-4 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                {item.title}
              </h3>
              <p className="mb-8 text-sm leading-7 text-black/75">{item.body}</p>
              <p className="text-sm font-semibold">{item.author}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
