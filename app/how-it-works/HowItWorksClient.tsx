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
      className="relative h-screen w-full overflow-x-hidden overflow-y-auto scroll-pt-16 snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
