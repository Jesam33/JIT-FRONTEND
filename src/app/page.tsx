import Hero from "@/components/landing/Hero";
import Sponsors from "@/components/landing/Sponsors";
import Capabilities from "@/components/landing/Capabilities";
import WhyChooseUs from "@/components/landing/WhyChooseUs";
import TrainingInstituteBanner from "@/components/landing/TrainingInstituteBanner";
import Showcase from "@/components/landing/Showcase";
import Testimonials from "@/components/landing/Testimonials";
import Newsletter from "@/components/landing/Newsletter";

export default function Home() {
  return (
    <>
      <Hero />
      <Sponsors />
      {/* <Capabilities /> */}
      {/* <WhyChooseUs /> */}
      <TrainingInstituteBanner />
      {/* <Showcase /> */}
      {/* <Testimonials /> */}
      <Newsletter />
    </>
  );
}
