"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { Edition } from "@/lib/data/editions";
import { EmailCaptureForm } from "./EmailCaptureForm";
import { HeroFilmCard } from "./HeroFilmCard";

const HERO_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type HeroRevealProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
};

function HeroReveal({ children, delay = 0, className, y = 28 }: HeroRevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: HERO_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function HeroFilmReveal({
  children,
  delay = 0.14,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 48, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.85, delay, ease: HERO_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type EditorialHeroContentProps = {
  upcomingEdition: Edition | null;
  latestPastEdition: Edition | null;
};

export function EditorialHeroContent({
  upcomingEdition,
  latestPastEdition,
}: EditorialHeroContentProps) {
  const eyebrow = upcomingEdition
    ? `Edition ${upcomingEdition.number}, coming ${upcomingEdition.dateLabel}`
    : "OmaHub, between editions";

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF1E4] to-oma-beige text-oma-black">
      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:px-6 sm:pb-16 sm:pt-[calc(4rem+env(safe-area-inset-top,0px))] lg:px-8 lg:pb-24 lg:pt-24">
        <div className="flex flex-col gap-10 lg:grid lg:min-h-[calc(100svh-6rem)] lg:grid-cols-[minmax(0,46%)_minmax(0,54%)] lg:items-center lg:gap-x-14 xl:gap-x-20">
          <div className="flex flex-col justify-center lg:py-10">
            <HeroReveal delay={0.04}>
              <div className="mb-6 sm:mb-8 lg:mb-10">
                <p className="text-[0.65rem] font-bold uppercase leading-snug tracking-[0.25em] text-oma-cocoa sm:text-xs sm:tracking-[0.3em]">
                  {eyebrow}
                </p>
              </div>
            </HeroReveal>

            <HeroReveal delay={0.1}>
              <h1 className="max-w-[14ch] font-canela text-[2.25rem] leading-[1.08] tracking-tight sm:max-w-[12ch] sm:text-[2.625rem] sm:leading-[1.06] lg:text-[3.25rem] lg:leading-[1.05] xl:text-6xl">
                African fashion,{" "}
                <span className="text-oma-plum">curated for you.</span>
              </h1>
            </HeroReveal>

            <HeroFilmReveal delay={0.16} className="mt-8 w-full lg:hidden">
              <HeroFilmCard />
            </HeroFilmReveal>

            <HeroReveal delay={0.22}>
              <p className="mt-6 max-w-md text-[0.9375rem] leading-relaxed text-oma-black/70 sm:mt-8 sm:text-base sm:leading-relaxed lg:text-lg">
                OmaHub is between editions. The next drop spotlights African
                designers you need to know, verified, curated, and ready to
                wear. Get early access.
              </p>
            </HeroReveal>

            {upcomingEdition?.applicationsOpen && (
              <HeroReveal delay={0.28}>
                <p className="mt-5 flex items-start gap-3 text-xs font-semibold uppercase leading-snug tracking-[0.18em] text-oma-plum sm:mt-6 sm:text-sm sm:tracking-[0.2em] lg:mt-8">
                  <span
                    aria-hidden
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-oma-gold"
                  />
                  Applications open for Edition {upcomingEdition.number}
                </p>
              </HeroReveal>
            )}

            <HeroReveal delay={0.34}>
              <div className="mt-5 sm:mt-6 lg:mt-8">
                <EmailCaptureForm
                  source="website"
                  variant="light"
                  buttonLabel="Notify me"
                  successMessage="You're in. Early access details land in your inbox first."
                />
              </div>
            </HeroReveal>

            {latestPastEdition && (
              <HeroReveal delay={0.42} y={16}>
                <Link
                  href={`/editions/${latestPastEdition.slug}`}
                  className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-oma-cocoa transition-colors hover:text-oma-plum sm:mt-8 sm:text-sm sm:tracking-[0.2em] lg:mt-10"
                >
                  Watch, OmaHub Edition {latestPastEdition.number}
                  <span aria-hidden>→</span>
                </Link>
              </HeroReveal>
            )}
          </div>

          <HeroFilmReveal delay={0.12} className="hidden w-full lg:flex lg:items-center lg:justify-end">
            <HeroFilmCard />
          </HeroFilmReveal>
        </div>
      </div>
    </section>
  );
}
