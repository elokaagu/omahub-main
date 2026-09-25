import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, MapPin, Star } from "lucide-react";
import { BrandActions } from "./BrandActions";
import type { BrandProfileData } from "./types";

/**
 * Brand page opening: the designer's photograph full-bleed, with the name,
 * category and contact actions over it. Mirrors the edition hero so the two
 * editorial surfaces feel like one site.
 */
export function BrandHero({ brand }: { brand: BrandProfileData }) {
  return (
    <section className="relative flex min-h-[26rem] flex-col justify-end overflow-hidden bg-oma-plum sm:min-h-[32rem] lg:min-h-[36rem]">
      {brand.image ? (
        <Image
          src={brand.image}
          alt=""
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-[center_25%]"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-[#735048] to-oma-plum"
        />
      )}

      {/* Light at the top for the breadcrumb, deep at the bottom for the name. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.55)_28%,rgba(0,0,0,0.15)_55%,rgba(0,0,0,0)_80%)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-6 pt-[calc(3.5rem+env(safe-area-inset-top,0px)+1rem)] sm:px-6 sm:pb-8 sm:pt-[calc(4rem+env(safe-area-inset-top,0px)+1.25rem)] lg:px-8">
        <nav aria-label="Breadcrumb">
          <Link
            href="/directory"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            The directory
          </Link>
        </nav>

        <div className="[text-shadow:0_2px_18px_rgb(0_0_0_/_45%)]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {brand.category && (
              <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                {brand.category}
              </span>
            )}
            {brand.isVerified && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-oma-gold">
                <BadgeCheck className="size-4" aria-hidden />
                Verified designer
              </span>
            )}
          </div>

          <h1 className="mt-3 max-w-4xl font-canela text-4xl leading-[1.05] text-white sm:text-5xl lg:text-6xl">
            {brand.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-white/85">
            {brand.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden />
                {brand.location}
              </span>
            )}
            {brand.rating ? (
              <span className="inline-flex items-center gap-1.5">
                <Star className="size-4 fill-oma-gold text-oma-gold" aria-hidden />
                {brand.rating}
                <span className="sr-only">out of 5</span>
              </span>
            ) : null}
          </div>
        </div>

        <BrandActions
          brandId={brand.id}
          brandName={brand.name}
          whatsapp={brand.whatsapp}
          image={brand.image}
          category={brand.category}
          location={brand.location}
          tone="onPhoto"
        />
      </div>
    </section>
  );
}
