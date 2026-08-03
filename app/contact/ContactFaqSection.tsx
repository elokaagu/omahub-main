"use client";

import { AnimatedSectionHeader } from "@/components/ui/animated-section-header";
import {
  StaggerOnScroll,
  StaggerOnScrollItem,
} from "@/components/ui/animate-on-scroll";
import { CONTACT_FAQ_ITEMS } from "./faqData";

export function ContactFaqSection() {
  return (
    <div className="mt-24">
      <AnimatedSectionHeader
        title="Frequently Asked Questions"
        subtitle="Find answers to common questions about OmaHub."
        centered
        className="mb-12"
      />

      <StaggerOnScroll
        className="grid grid-cols-1 gap-8 md:grid-cols-2"
        staggerDelay={0.1}
      >
        {CONTACT_FAQ_ITEMS.map((item) => (
          <StaggerOnScrollItem key={item.id} animation="slideUp">
            <div className="rounded-lg border border-oma-gold/20 bg-white p-8 transition-colors duration-300 hover:border-oma-gold/40">
              <h4 className="mb-3 font-source text-xl text-oma-black">
                {item.title}
              </h4>
              <p className={`text-oma-cocoa ${item.bodyClassName ?? ""}`.trim()}>
                {item.body}
              </p>
            </div>
          </StaggerOnScrollItem>
        ))}
      </StaggerOnScroll>
    </div>
  );
}
