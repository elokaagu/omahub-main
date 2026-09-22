import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DirectoryBrand } from "./directoryQuery";

type DirectoryBrandCardProps = {
  brand: DirectoryBrand;
  view: "grid" | "list";
  /** The first row is eager-loaded; everything else waits until it scrolls in. */
  priority?: boolean;
};

function Meta({ brand }: { brand: DirectoryBrand }) {
  return (
    <p className="mt-1 truncate text-sm text-oma-cocoa/80">
      {[brand.category, brand.location].filter(Boolean).join(" · ")}
    </p>
  );
}

function Rating({ value }: { value?: number }) {
  if (!value || value <= 0) return null;
  return (
    <span className="mt-2 inline-flex items-center gap-1 text-xs text-oma-cocoa/70">
      <Star className="size-3.5 fill-oma-gold text-oma-gold" aria-hidden />
      {value.toFixed(1)}
      <span className="sr-only">out of 5</span>
    </span>
  );
}

/** One designer in the directory, in grid or list layout. */
export function DirectoryBrandCard({
  brand,
  view,
  priority = false,
}: DirectoryBrandCardProps) {
  const name = (
    <span className="flex items-center gap-1.5">
      <span className="truncate font-canela text-lg text-oma-black">
        {brand.name}
      </span>
      {brand.isVerified && (
        <BadgeCheck
          className="size-4 shrink-0 text-oma-gold"
          aria-label="Verified designer"
        />
      )}
    </span>
  );

  if (view === "list") {
    return (
      <Link
        href={`/brand/${brand.id}`}
        className="group flex items-center gap-4 rounded-2xl border border-oma-gold/15 bg-white p-3 transition-colors hover:border-oma-gold/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oma-plum/40 sm:gap-5 sm:p-4"
      >
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-oma-beige/60 sm:size-24">
          <Image
            src={brand.image}
            alt=""
            fill
            sizes="96px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={priority}
          />
        </div>
        <span className="min-w-0 flex-1">
          {name}
          <Meta brand={brand} />
          <Rating value={brand.rating} />
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={`/brand/${brand.id}`}
      className="group block focus-visible:outline-none"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-oma-beige/60 ring-1 ring-oma-gold/10 transition-shadow group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-oma-plum/50">
        <Image
          src={brand.image}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={cn(
            "object-cover transition-transform duration-500",
            "group-hover:scale-[1.03]",
          )}
          priority={priority}
        />
      </div>
      <div className="mt-3">
        {name}
        <Meta brand={brand} />
        <Rating value={brand.rating} />
      </div>
    </Link>
  );
}
