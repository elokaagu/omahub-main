"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSectionReveal } from "../useSectionReveal";
import {
  headingRevealStyle,
  sectionEnterStyle,
  textStaggerStyle,
} from "../howItWorksMotion";
import { FloatingOrbs, SectionCorners } from "../HowItWorksDecor";

export function FinalCtaSection() {
  const { ref, isVisible } = useSectionReveal();

  return (
    <section
      ref={ref}
      id="cta"
      className="relative flex min-h-screen snap-start flex-col items-center justify-center bg-gradient-to-t from-oma-plum/10 to-white px-4 py-24"
      style={sectionEnterStyle(isVisible)}
    >
      <SectionCorners variant="cta" />
      <FloatingOrbs preset="ctaBg" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-center gap-12 px-2 sm:px-4 md:flex-row md:px-8">
        <div className="flex flex-1 items-center justify-center">
          <div className="relative h-80 w-80">
            <div className="flex h-full w-full items-center justify-center">
              <div className="relative">
                <div className="flex h-64 w-48 items-center justify-center rounded-2xl border-2 border-oma-plum/40 bg-gradient-to-br from-oma-gold/20 to-oma-plum/20 backdrop-blur-sm">
                  <svg
                    className="h-24 w-24 text-oma-plum"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5zM12 22c-4.75-1.1-8-4.86-8-9V8.3l8-3.2 8 3.2V13c0 4.14-3.25 7.9-8 9z" />
                    <path d="M12 6l-6 2.4V13c0 3.64 2.43 6.97 6 8.4 3.57-1.43 6-4.76 6-8.4V8.4L12 6z" />
                    <path d="M12 10l-3 1.2V15c0 2.14 1.43 4.1 3 4.8 1.57-.7 3-2.66 3-4.8v-3.8L12 10z" />
                  </svg>
                </div>
                <div className="absolute -right-2 -top-2 h-8 w-8 animate-bounce rounded-full bg-oma-plum shadow-lg" />
                <div
                  className="absolute -bottom-2 -left-2 h-6 w-6 animate-bounce rounded-full bg-oma-gold shadow-lg"
                  style={{ animationDelay: "0.3s" }}
                />
                <div className="absolute -left-4 top-1/2 h-4 w-4 animate-ping rounded-full bg-oma-beige" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 pl-0 text-center text-oma-cocoa md:pl-12 md:text-left">
          <h2
            className="mb-6 font-canela text-4xl leading-tight md:text-5xl"
            style={headingRevealStyle(isVisible)}
          >
            Ready to Get Started?
          </h2>
          <p
            className="mx-auto mb-8 max-w-xl text-xl leading-relaxed text-oma-cocoa/80 md:mx-0"
            style={textStaggerStyle(isVisible, 0.15)}
          >
            Join thousands of fashion lovers discovering Africa&apos;s most
            talented designers, or apply to join our curated community.
          </p>
          <div
            className="flex flex-col justify-center gap-4 sm:flex-row md:justify-start"
            style={textStaggerStyle(isVisible, 0.25)}
          >
            <Button
              asChild
              size="lg"
              className="bg-oma-plum px-8 py-4 text-lg text-white hover:bg-oma-plum/90"
            >
              <Link href="/directory">Start Shopping</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-oma-plum px-8 py-4 text-lg text-oma-plum hover:bg-oma-plum/10"
            >
              <Link href="/join">Apply as Designer</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
