"use client";

import { useRef } from "react";
import Nav from "./Nav";
import Hero from "./Hero";
import Problem from "./Problem";
import Features from "./Features";
import Hardware from "./Hardware";
import Trust from "./Trust";
import FinalCTA from "./FinalCTA";
import Footer from "./Footer";
import { FeaturesGrid } from "@/components/sections/FeaturesGrid";
import { PricingSection } from "@/components/sections/PricingSection";

export default function LandingClient() {
  const featuresContainerRef = useRef<HTMLElement>(null);

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Nav />
      <Hero />
      <Problem />
      <Features containerRef={featuresContainerRef} />
      <FeaturesGrid />
      <Hardware />
      <PricingSection />
      <Trust />
      <FinalCTA />
      <Footer />
    </main>
  );
}
