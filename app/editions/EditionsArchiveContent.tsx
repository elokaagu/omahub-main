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
      <section
        className="relative flex min-h-[60vh] flex-col justify-end bg-oma-plum bg-cover bg-top pb-16 pt-10 text-white sm:min-h-[70vh] sm:pb-20 sm:pt-14"
        style={heroImage ? { backgroundImage: `url(${heroImage})` } : undefined}
      >
        <div className="relative mx-auto w-full max-w-7xl px-4 [text-shadow:0_2px_16px_rgb(0_0_0_/_45%)] sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fadeIn" duration={0.5}>
            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50 transition-colors hover:text-oma-gold"
            >
              ← OmaHub
            </Link>
          </AnimateOnScroll>

          <AnimateOnScroll animation="slideUp" delay={0.08} duration={0.7}>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-oma-gold">
              OmaHub editions
            </p>
            <h1 className="mt-3 font-canela text-5xl sm:text-6xl">The Archive</h1>
          </AnimateOnScroll>

          <AnimateOnScroll animation="slideUp" delay={0.18} duration={0.7}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
              Every edition is a story: the theme, the designers, the room.
              Newest first. This is what separates OmaHub from a directory.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StaggerOnScroll
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
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
