"use client";

import { AnimatedSectionHeader } from "@/components/ui/animated-section-header";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import { ContactFaqSection } from "./ContactFaqSection";
import { ContactFormSection } from "./ContactFormSection";
import { ContactInfoSection } from "./ContactInfoSection";
import { NewsletterSignupCard } from "./NewsletterSignupCard";

export function ContactPageContent() {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-12 md:py-24">
      <AnimatedSectionHeader
        title="Get in Touch"
        subtitle="Have questions or inquiries? Reach out to our team and we'll get back to you shortly."
        centered
        className="mb-16"
        titleClassName="text-4xl md:text-5xl font-canela"
        subtitleClassName="text-base text-oma-cocoa/80 mt-2"
      />

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:gap-20">
        <AnimateOnScroll animation="slideUp" duration={0.7}>
          <ContactFormSection />
        </AnimateOnScroll>

        <div className="space-y-12">
          <AnimateOnScroll animation="slideUp" delay={0.12} duration={0.7}>
            <ContactInfoSection />
          </AnimateOnScroll>
          <AnimateOnScroll animation="slideUp" delay={0.22} duration={0.7}>
            <NewsletterSignupCard />
          </AnimateOnScroll>
        </div>
      </div>

      <ContactFaqSection />
    </div>
  );
}
