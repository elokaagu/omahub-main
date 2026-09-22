import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { EditionFactsBar, type EditionFact } from "./EditionFactsBar";
import {
  editionDisplayTitle,
  getAdjacentEditions,
  type Edition,
} from "@/lib/data/editions";


type EditionHeroProps = {
  edition: Edition;
  coverImage?: string;
  /** City / Country / Venue / Date / Lineup - shown in the strip under the image. */
  facts: EditionFact[];
};

/**
 * Edition page opening: cover image with breadcrumb, title and
 * previous/next edition controls, plus the facts strip - sized together so
 * both fit in the first screen below the site header.
 */
export function EditionHero({ edition, coverImage, facts }: EditionHeroProps) {
  const title = editionDisplayTitle(edition);
  const { previous, next } = getAdjacentEditions(edition.slug);

  return (
    <section
      aria-labelledby="edition-title"
      // Viewport minus the fixed site header; a floor keeps very short
      // (landscape phone) screens from squashing the title.
      className="flex h-[calc(100svh-3.5rem-env(safe-area-inset-top,0px))] min-h-[32rem] flex-col sm:h-[calc(100svh-4rem-env(safe-area-inset-top,0px))]"
    >
      <div className="relative min-h-0 flex-1 overflow-hidden bg-oma-plum">
        {coverImage ? (
          <Image
            src={coverImage}
            alt=""
            fill
            priority
            quality={90}
            sizes="100vw"
            className="object-cover object-[center_20%] lg:object-[center_15%]"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-[#735048] to-oma-plum"
          />
        )}
        {/* Scrim for the breadcrumb. */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent"
        />
        {/* Scrim behind the title: darkest where the text sits, transparent at
            both ends so it leaves no visible edge against the fade below. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0)_0%,rgba(0,0,0,0.72)_20%,rgba(0,0,0,0.38)_42%,rgba(0,0,0,0)_72%)]"
        />
        {/* Photo dissolves into the facts bar below. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-b from-transparent via-oma-beige/70 to-oma-beige sm:h-36"
        />

        {/* Bottom padding clears the fade, so the title stays on the photo. */}
        <div className="relative z-20 mx-auto flex h-full w-full max-w-7xl flex-col justify-between px-4 pb-28 pt-5 sm:px-6 sm:pb-36 sm:pt-7 lg:px-8">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              <li>
                <Link
                  href="/editions"
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <ArrowLeft className="size-3.5" aria-hidden />
                  Editions
                </Link>
              </li>
              <li aria-hidden className="text-white/50">
                /
              </li>
              <li aria-current="page" className="text-white">
                Edition {edition.number}
              </li>
            </ol>
          </nav>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="[text-shadow:0_2px_18px_rgb(0_0_0_/_45%)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-oma-gold sm:text-xs">
                Edition {edition.number} · {edition.dateLabel}
              </p>
              <h1
                id="edition-title"
                className="mt-3 max-w-3xl font-canela text-4xl leading-[1.05] text-white sm:text-5xl lg:text-7xl"
              >
                {title}
              </h1>
            </div>

            {(previous || next) && (
              <nav
                aria-label="More editions"
                className="flex shrink-0 gap-2 sm:gap-3"
              >
                {previous && (
                  <EditionStepLink edition={previous} direction="previous" />
                )}
                {next && <EditionStepLink edition={next} direction="next" />}
              </nav>
            )}
          </div>
        </div>
      </div>

      <EditionFactsBar facts={facts} />
    </section>
  );
}

function EditionStepLink({
  edition,
  direction,
}: {
  edition: Edition;
  direction: "previous" | "next";
}) {
  const isPrevious = direction === "previous";
  const Arrow = isPrevious ? ArrowLeft : ArrowRight;
  const title = editionDisplayTitle(edition);

  return (
    <Link
      href={`/editions/${edition.slug}`}
      aria-label={`${isPrevious ? "Previous" : "Next"} edition: ${title}`}
      className="group flex min-h-[44px] min-w-0 flex-1 items-center gap-3 rounded-full border border-white/35 bg-black/25 px-4 py-2 text-white backdrop-blur-sm transition-colors hover:border-white/70 hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 lg:max-w-[16rem] lg:flex-none"
    >
      {isPrevious && (
        <Arrow className="size-4 shrink-0 transition-transform group-hover:-translate-x-0.5" aria-hidden />
      )}
      <span className={`min-w-0 ${isPrevious ? "text-left" : "ml-auto text-right"}`}>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
          {isPrevious ? "Previous" : "Next"}
        </span>
        <span className="block truncate text-sm">{title}</span>
      </span>
      {!isPrevious && (
        <Arrow className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
      )}
    </Link>
  );
}
