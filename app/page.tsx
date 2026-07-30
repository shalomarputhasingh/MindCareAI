import { Faq } from "@/features/landing/faq";
import { FeaturesGrid } from "@/features/landing/features-grid";
import { Hero } from "@/features/landing/hero";
import { SiteFooter } from "@/features/landing/site-footer";
import { SiteHeader } from "@/features/landing/site-header";
import { WhySection } from "@/features/landing/why-section";

/** The public landing page. */
export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <FeaturesGrid />
        <WhySection />
        <Faq />
      </main>
      <SiteFooter />
    </>
  );
}
