import Link from "next/link";
import { FullWidthBrandRow } from "@/components/ui/full-width-brand-row";

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
    <section className="bg-white py-16 sm:py-20">
      <FullWidthBrandRow
        title="Brands we've worked with"
        subtitle="Every brand here has shown at an OmaHub edition — curated and verified in person."
        brands={brands}
      />
      <div className="mt-10 text-center">
        <Link
          href="/directory"
          className="inline-flex items-center gap-2 border-b border-oma-plum/40 pb-0.5 text-xs font-semibold uppercase tracking-[0.2em] text-oma-plum transition-colors hover:border-oma-plum hover:text-oma-cocoa"
        >
          Browse the full directory <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
