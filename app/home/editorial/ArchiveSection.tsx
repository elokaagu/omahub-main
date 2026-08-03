"use client";

import Link from "next/link";
import type { Edition } from "@/lib/data/editions";
import { EditionCard } from "./EditionCard";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

type ArchiveSectionProps = {
  /** Newest first; keep the homepage to three cards max */
  editions: Edition[];
};

export function ArchiveSection({ editions }: ArchiveSectionProps) {
  if (editions.length === 0) return null;

  return (
    <section className="bg-oma-beige py-14 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll animation="slideInFromRight" duration={0.65}>
          <div className="flex flex-col gap-4 border-b border-oma-cocoa/20 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oma-cocoa">
                Past editions
              </p>
              <h2 className="mt-2 font-canela text-3xl text-oma-black sm:text-4xl lg:text-5xl">
                The Archive
              </h2>
            </div>
            <Link
              href="/editions"
              className="w-fit border-b border-oma-plum/40 pb-0.5 text-xs font-semibold uppercase tracking-[0.2em] text-oma-plum transition-colors hover:border-oma-plum hover:text-oma-cocoa"
            >
              View all editions
            </Link>
          </div>
        </AnimateOnScroll>

        <div className="mt-8 grid gap-6 sm:mt-12 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {editions.slice(0, 3).map((edition, index) => (
            <AnimateOnScroll
              key={edition.slug}
              animation="slideInFromRight"
              delay={0.08 + index * 0.12}
              duration={0.7}
            >
              <EditionCard edition={edition} />
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
