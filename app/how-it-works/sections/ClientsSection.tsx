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

export function ClientsSection() {
  const { ref, isVisible } = useSectionReveal();

  return (
    <section
      ref={ref}
      id="clients"
      className="relative flex min-h-screen snap-center flex-col items-center justify-center bg-white px-4 py-16"
      style={sectionEnterStyle(isVisible)}
    >
      <SectionCorners variant="clients" />
      <FloatingOrbs preset="stackA" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-center gap-12 px-2 sm:px-4 md:flex-row md:px-8">
        <div className="flex w-full max-w-full flex-1 items-center justify-center">
          <img
            src="/meet-me.PNG"
            alt="Meet Me Collection Mobile Mockup"
            className="max-h-[60vh] w-full max-w-sm rounded-2xl border border-oma-beige/40 shadow-2xl"
            style={{ background: "transparent" }}
          />
        </div>
        <div className="w-full max-w-full flex-1 pl-0 text-oma-cocoa md:pl-12">
          <h2
            className="mb-6 font-canela text-4xl leading-tight md:text-5xl"
            style={headingRevealStyle(isVisible)}
          >
            For Clients
          </h2>
          <p
            className="mb-8 max-w-xl text-xl leading-relaxed text-oma-cocoa/80"
            style={textStaggerStyle(isVisible, 0.15)}
          >
            Discover and connect with Africa&apos;s most talented designers.
            Enjoy a seamless, curated experience from inspiration to delivery.
          </p>
          <div style={textStaggerStyle(isVisible, 0.25)}>
            <Button
              asChild
              size="lg"
              className="group border-2 border-oma-plum bg-oma-plum px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:border-oma-gold hover:bg-oma-plum/90"
            >
              <Link href="/directory" className="flex items-center gap-3">
                Explore Designers
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
