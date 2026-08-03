"use client";

import {
  AnimateOnScroll,
} from "@/components/ui/animate-on-scroll";

export function FilmSectionCopy() {
  return (
    <div className="mx-auto w-full max-w-7xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]">
      <AnimateOnScroll animation="slideUp" duration={0.65}>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-oma-gold sm:text-xs sm:tracking-[0.3em]">
          The short film
        </p>
      </AnimateOnScroll>
      <AnimateOnScroll animation="slideInFromRight" delay={0.08} duration={0.75}>
        <h2 className="mt-2 font-canela text-3xl text-white sm:mt-3 sm:text-4xl lg:text-5xl">
          Art Of Adornment
        </h2>
      </AnimateOnScroll>
      <AnimateOnScroll animation="slideUp" delay={0.16} duration={0.7}>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-white/80 sm:mt-4 sm:text-lg">
          The designers behind the diaspora&apos;s most exciting labels, in
          their own words.
        </p>
      </AnimateOnScroll>
    </div>
  );
}
