"use client";

import Link from "next/link";
import type { Edition } from "@/lib/data/editions";
import { EditionCard } from "@/app/home/editorial/EditionCard";
import {
  AnimateOnScroll,
  StaggerOnScroll,
  StaggerOnScrollItem,
} from "@/components/ui/animate-on-scroll";

type EditionsArchiveContentProps = {
  editions: Edition[];
  heroImage?: string;
};

export function EditionsArchiveContent({
  editions,
  heroImage,
}: EditionsArchiveContentProps) {
  return (
    <main className="min-h-screen bg-oma-beige">
      <section className="relative flex min-h-[55dvh] min-h-[55svh] flex-col justify-end overflow-hidden bg-oma-plum pb-12 pt-8 text-white sm:min-h-[70vh] sm:pb-20 sm:pt-14">
        {heroImage && (
          <>
            <div
              aria-hidden
              className="absolute inset-0 bg-cover bg-[center_20%] sm:bg-top"
              style={{ backgroundImage: `url(${heroImage})` }}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10"
            />
          </>
        )}
        <div className="relative mx-auto w-full max-w-7xl px-4 [text-shadow:0_2px_16px_rgb(0_0_0_/_45%)] sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fadeIn" duration={0.5}>
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center text-xs font-semibold uppercase tracking-[0.25em] text-white/50 transition-colors hover:text-oma-gold"
            >
              ← OmaHub
            </Link>
          </AnimateOnScroll>

          <AnimateOnScroll animation="slideUp" delay={0.08} duration={0.7}>
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-oma-gold sm:mt-8 sm:text-xs sm:tracking-[0.3em]">
              OmaHub editions
            </p>
            <h1 className="mt-2 font-canela text-4xl text-white sm:mt-3 sm:text-6xl">
              The Archive
            </h1>
          </AnimateOnScroll>

          <AnimateOnScroll animation="slideUp" delay={0.18} duration={0.7}>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:mt-6 sm:text-lg">
              Every edition is a story: the theme, the designers, the room.
              Newest first. This is what separates OmaHub from a directory.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StaggerOnScroll
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3"
            staggerDelay={0.12}
            delay={0.05}
          >
            {editions.map((edition) => (
              <StaggerOnScrollItem key={edition.slug} animation="slideInFromRight">
                <EditionCard edition={edition} />
              </StaggerOnScrollItem>
            ))}
          </StaggerOnScroll>
        </div>
      </section>
    </main>
  );
}
