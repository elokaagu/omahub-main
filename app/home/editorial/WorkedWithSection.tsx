"use client";

import Link from "next/link";
import { FullWidthBrandRow } from "@/components/ui/full-width-brand-row";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

export type WorkedWithBrand = {
  id: string;
  name: string;
  image: string;
  category: string;
  location: string;
  rating: number;
  isVerified: boolean;
  video_url?: string;
  video_thumbnail?: string;
};

type WorkedWithSectionProps = {
  brands: WorkedWithBrand[];
};

/**
 * Brands that have shown at an OmaHub edition — instant verification and
 * credibility, ahead of the wider discovery directory.
 */
export function WorkedWithSection({ brands }: WorkedWithSectionProps) {
  if (brands.length === 0) return null;

  return (
    <section className="bg-white py-14 sm:py-16 lg:py-20">
      <AnimateOnScroll animation="slideInFromRight" duration={0.65}>
        <FullWidthBrandRow
          title="Brands we've worked with"
          subtitle="Every brand here has shown at an OmaHub edition, curated and verified in person."
          brands={brands}
        />
      </AnimateOnScroll>
      <AnimateOnScroll animation="slideInFromRight" delay={0.12} duration={0.65}>
        <div className="mt-10 text-center">
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 border-b border-oma-plum/40 pb-0.5 text-xs font-semibold uppercase tracking-[0.2em] text-oma-plum transition-colors hover:border-oma-plum hover:text-oma-cocoa"
          >
            Browse the full directory <span aria-hidden>→</span>
          </Link>
        </div>
      </AnimateOnScroll>
    </section>
  );
}
