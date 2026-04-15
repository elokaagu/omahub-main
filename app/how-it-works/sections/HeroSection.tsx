"use client";

import { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSectionReveal } from "../useSectionReveal";
import { useParallaxLayer } from "../useParallaxLayer";
import {
  headingRevealStyle,
  sectionEnterStyle,
  textStaggerStyle,
} from "../howItWorksMotion";
import { FloatingOrbs } from "../HowItWorksDecor";

export function HeroSection() {
  const { ref, isVisible } = useSectionReveal();
  const parallaxRef = useRef<HTMLDivElement>(null);
  useParallaxLayer(parallaxRef, 0.08, 100);

  return (
    <section
      ref={ref}
      id="hero"
      className="relative flex min-h-screen snap-start flex-col items-center justify-center px-4 pt-24 text-center sm:pt-28"
    >
      <div
        ref={parallaxRef}
        className="pointer-events-none absolute inset-0 z-0 h-full w-full will-change-transform"
      >
        <img
          src="/community.jpg"
          alt="OmaHub Community"
          className="h-full w-full max-h-screen object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-oma-plum/30 via-transparent to-oma-gold/20" />
      </div>

      <FloatingOrbs preset="hero" />

      <div
        className="relative z-10 mx-auto max-w-4xl text-center"
        style={sectionEnterStyle(isVisible)}
      >
        <h1
          className="mb-4 font-canela text-4xl leading-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.45)] sm:mb-6 sm:text-5xl md:text-7xl"
          style={headingRevealStyle(isVisible)}
        >
          How OmaHub Works
        </h1>
        <p
          className="mx-auto mb-6 max-w-3xl text-base leading-relaxed text-white/90 drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:mb-8 sm:text-lg md:text-2xl"
          style={textStaggerStyle(isVisible, 0.2)}
        >
          Connecting fashion lovers with Africa&apos;s most talented designers
        </p>

        <div
          className="mx-auto mb-8 flex w-full max-w-xs flex-col justify-center gap-4 sm:mb-12 sm:max-w-none sm:flex-row"
          style={textStaggerStyle(isVisible, 0.28)}
        >
          <Button
            asChild
            size="lg"
            className="group w-full bg-oma-plum px-6 py-3 text-base text-white hover:bg-oma-plum/90 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
          >
            <Link href="/directory">Explore Designers</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full border-oma-plum px-6 py-3 text-base text-oma-plum hover:bg-oma-plum/10 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
          >
            <Link href="/join">Join as Designer</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
