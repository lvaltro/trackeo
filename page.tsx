import { Nav } from "@/components/sections/Nav";
import { HeroVideoScroll } from "@/components/sections/HeroVideoScroll";
import { ValuePillars } from "@/components/sections/ValuePillars";
import { DashboardStoryScroll } from "@/components/sections/DashboardStoryScroll";
import { PricingSection } from "@/components/sections/PricingSection";
import { FeaturesGrid } from "@/components/sections/FeaturesGrid";
import { SocialProof } from "@/components/sections/SocialProof";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <HeroVideoScroll />
        <ValuePillars />
        <DashboardStoryScroll />
        <PricingSection />
        <FeaturesGrid />
        <SocialProof />
        <FinalCTA />
        <Footer />
      </main>
    </>
  );
}
