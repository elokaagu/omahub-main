"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useSectionReveal } from "../useSectionReveal";
import {
  headingRevealStyle,
  sectionEnterStyle,
  textStaggerStyle,
} from "../howItWorksMotion";
import { FloatingOrbs, SectionCorners } from "../HowItWorksDecor";

export function FaqPromoSection() {
  const { ref, isVisible } = useSectionReveal();

  return (
    <section
      ref={ref}
      id="faq"
      className="relative flex min-h-screen snap-start flex-col items-center justify-center bg-white px-4 py-24"
      style={sectionEnterStyle(isVisible)}
    >
      <SectionCorners variant="standard" />
      <FloatingOrbs preset="faq" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-between gap-12 px-2 sm:px-4 md:flex-row-reverse md:px-8">
        <div className="flex flex-1 items-center justify-center">
          <div className="relative h-80 w-80">
            <div className="flex h-full w-full items-center justify-center">
              <div className="relative">
                <div className="flex h-64 w-48 items-center justify-center rounded-2xl border-2 border-oma-gold/40 bg-gradient-to-br from-oma-plum/20 to-oma-gold/20 backdrop-blur-sm">
                  <svg
                    className="h-24 w-24 text-oma-plum"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
                  </svg>
                </div>
                <div className="absolute -right-2 -top-2 h-8 w-8 animate-bounce rounded-full bg-oma-gold shadow-lg" />
                <div
                  className="absolute -bottom-2 -left-2 h-6 w-6 animate-bounce rounded-full bg-oma-plum shadow-lg"
                  style={{ animationDelay: "0.3s" }}
                />
                <div className="absolute -left-4 top-1/2 h-4 w-4 animate-ping rounded-full bg-oma-beige" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 pr-0 text-oma-cocoa md:pr-12">
          <h2
            className="mb-6 font-canela text-4xl leading-tight md:text-5xl"
            style={headingRevealStyle(isVisible)}
          >
            Frequently Asked Questions
          </h2>
          <p
            className="mb-8 max-w-xl text-xl leading-relaxed text-oma-cocoa/80"
            style={textStaggerStyle(isVisible, 0.15)}
          >
            Everything you need to know about OmaHub, from how to order to
            joining as a designer. Still have questions? We&apos;re here to
            help.
          </p>
          <div style={textStaggerStyle(isVisible, 0.25)}>
            <Button
              asChild
              size="lg"
              className="group border-2 border-oma-plum bg-oma-plum px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:border-oma-gold hover:bg-oma-plum/90"
            >
              <Link href="/faq" className="flex items-center gap-3">
                Read All FAQs
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
