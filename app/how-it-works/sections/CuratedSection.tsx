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

export function CuratedSection() {
  const { ref, isVisible } = useSectionReveal();

  return (
    <section
      ref={ref}
      id="curated"
      className="relative flex min-h-screen snap-center flex-col items-center justify-center bg-oma-beige/20 px-4 py-24"
      style={sectionEnterStyle(isVisible)}
    >
      <SectionCorners variant="standard" />
      <FloatingOrbs preset="stackA" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-center gap-12 px-2 sm:px-4 md:flex-row md:px-8">
        <div className="relative mb-8 flex w-full max-w-full flex-1 flex-col items-center justify-center gap-6 md:mb-0">
          <div className="relative mx-auto h-48 w-full max-w-xs sm:h-80">
            <div className="absolute inset-0 rotate-12 transform animate-pulse">
              <div className="h-64 w-48 rounded-lg border-2 border-oma-plum/40 bg-gradient-to-br from-oma-gold/30 to-oma-plum/30 backdrop-blur-sm">
                <div className="p-4">
                  <div className="mb-4 h-8 w-full rounded bg-oma-beige/30" />
                  <div className="mb-2 h-4 w-3/4 rounded bg-oma-cocoa/20" />
                  <div className="h-4 w-1/2 rounded bg-oma-cocoa/20" />
                </div>
              </div>
            </div>
            <div
              className="absolute inset-0 -rotate-6 transform animate-pulse"
              style={{ animationDelay: "0.5s" }}
            >
              <div className="h-64 w-48 rounded-lg border-2 border-oma-gold/40 bg-gradient-to-br from-oma-plum/30 to-oma-beige/30 backdrop-blur-sm">
                <div className="p-4">
                  <div className="mb-4 h-8 w-full rounded bg-oma-beige/30" />
                  <div className="mb-2 h-4 w-2/3 rounded bg-oma-cocoa/20" />
                  <div className="h-4 w-3/4 rounded bg-oma-cocoa/20" />
                </div>
              </div>
            </div>
            <div
              className="absolute inset-0 rotate-3 transform animate-pulse"
              style={{ animationDelay: "1s" }}
            >
              <div className="h-64 w-48 rounded-lg border-2 border-oma-beige/40 bg-gradient-to-br from-oma-beige/30 to-oma-gold/30 backdrop-blur-sm">
                <div className="p-4">
                  <div className="mb-4 h-8 w-full rounded bg-oma-gold/30" />
                  <div className="mb-2 h-4 w-4/5 rounded bg-oma-cocoa/20" />
                  <div className="h-4 w-1/3 rounded bg-oma-cocoa/20" />
                </div>
              </div>
            </div>
            <div className="absolute right-4 top-4 h-6 w-6 animate-bounce rounded-full bg-oma-plum shadow-lg" />
            <div
              className="absolute bottom-8 left-8 h-4 w-4 animate-bounce rounded-full bg-oma-gold shadow-lg"
              style={{ animationDelay: "0.3s" }}
            />
            <div className="absolute left-0 top-1/2 h-3 w-3 animate-ping rounded-full bg-oma-beige" />
          </div>
        </div>

        <div className="w-full max-w-full flex-1 px-4 pl-0 text-oma-cocoa md:pl-12">
          <h2
            className="mb-6 break-words font-canela text-2xl leading-tight sm:text-3xl md:text-5xl"
            style={headingRevealStyle(isVisible)}
          >
            Curated, and not sorry about it.
          </h2>
          <p
            className="mb-8 max-w-xl break-words text-base leading-relaxed text-oma-cocoa/80 sm:text-xl"
            style={textStaggerStyle(isVisible, 0.15)}
          >
            We&apos;re by invitation only; which means you only discover
            designers if our team of curators are convinced their work is
            exceptional for you. This ensures you&apos;ll only find pieces
            alongside others at the top of their craft.
          </p>
          <div style={textStaggerStyle(isVisible, 0.25)}>
            <Button
              asChild
              size="lg"
              className="group border-2 border-oma-plum bg-oma-plum px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:border-oma-gold hover:bg-oma-plum/90"
            >
              <Link href="/directory" className="flex items-center gap-3">
                Explore Curated Designers
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
