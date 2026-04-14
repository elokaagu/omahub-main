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

export function DesignersSection() {
  const { ref, isVisible } = useSectionReveal();

  return (
    <section
      ref={ref}
      id="designers"
      className="relative flex min-h-screen snap-center flex-col items-center justify-center bg-white px-4 py-24"
      style={sectionEnterStyle(isVisible)}
    >
      <SectionCorners variant="standard" />
      <FloatingOrbs preset="stackB" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-center gap-12 px-2 sm:px-4 md:flex-row md:px-8">
        <div className="relative mb-8 flex w-full max-w-full flex-1 flex-col items-center justify-center md:mb-0">
          <div className="relative mx-auto h-auto w-full max-w-xs">
            <img
              src="/omahub-perspective.PNG"
              alt="OmaHub Perspective Mockup"
              className="h-auto w-full max-w-full rounded-2xl border-4 border-oma-beige/60 bg-white/80 object-cover shadow-2xl"
            />
            <div className="absolute right-4 top-4 h-6 w-6 animate-bounce rounded-full bg-oma-gold shadow-lg" />
            <div
              className="absolute bottom-8 left-8 h-4 w-4 animate-bounce rounded-full bg-oma-plum shadow-lg"
              style={{ animationDelay: "0.3s" }}
            />
            <div className="absolute left-0 top-1/2 h-3 w-3 animate-ping rounded-full bg-oma-beige" />
          </div>
        </div>
        <div className="flex-1 pl-0 text-oma-cocoa md:pl-12">
          <h2
            className="mb-6 font-canela text-4xl leading-tight md:text-5xl"
            style={headingRevealStyle(isVisible)}
          >
            For Designers
          </h2>
          <p
            className="mb-8 max-w-xl text-xl leading-relaxed text-oma-cocoa/80"
            style={textStaggerStyle(isVisible, 0.15)}
          >
            Share your vision and collections with a global audience. Build your
            brand, connect with clients, and grow your creative business on
            OmaHub.
          </p>
          <div style={textStaggerStyle(isVisible, 0.25)}>
            <Button
              asChild
              size="lg"
              className="group border-2 border-oma-plum bg-oma-plum px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:border-oma-gold hover:bg-oma-plum/90"
            >
              <Link href="/join" className="flex items-center gap-3">
                Apply as Designer
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
