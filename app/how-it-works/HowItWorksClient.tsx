"use client";

import { HeroSection } from "./sections/HeroSection";
import { ClientsSection } from "./sections/ClientsSection";
import { CuratedSection } from "./sections/CuratedSection";
import { DesignersSection } from "./sections/DesignersSection";
import { FeaturesSection } from "./sections/FeaturesSection";
import { FaqPromoSection } from "./sections/FaqPromoSection";
import { FinalCtaSection } from "./sections/FinalCtaSection";

export default function HowItWorksClient() {
  return (
    <div
      className="relative h-screen w-full overflow-y-auto md:snap-y md:snap-mandatory"
      style={{ scrollBehavior: "smooth" }}
    >
      <HeroSection />
      <ClientsSection />
      <CuratedSection />
      <DesignersSection />
      <FeaturesSection />
      <FaqPromoSection />
      <FinalCtaSection />
    </div>
  );
}
