import Image from "next/image";
import Link from "next/link";
import type { Edition } from "@/lib/data/editions";

type EditionHeroProps = {
  edition: Edition;
  coverImage?: string;
};

/**
 * Full-viewport edition hero — one screen tall, no overflow, with a soft
 * fade into the beige snapshot section below.
 */
export function EditionHero({ edition, coverImage }: EditionHeroProps) {
  const title =
    edition.status === "upcoming" && !edition.themeAnnounced
      ? `Edition ${edition.number}: TBA`
      : edition.title;

  return (
    <section className="relative h-svh max-h-svh w-full overflow-hidden bg-oma-plum">
      {coverImage ? (
        <Image
          src={coverImage}
          alt=""
          fill
          priority
          quality={92}
          sizes="100vw"
          className="object-cover object-[center_18%] sm:object-[center_15%]"
          aria-hidden
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-[#735048] to-oma-plum"
        />
      )}

      {/* Dark scrim so headline stays readable on bright photography */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/5"
      />

      {/* Fade into the oma-beige snapshot band below */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-oma-beige from-10% via-oma-beige/70 to-transparent sm:h-36"
      />

      <div className="relative z-10 flex h-full flex-col justify-end pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto w-full max-w-7xl px-4 [text-shadow:0_2px_18px_rgb(0_0_0_/_55%)] sm:px-6 lg:px-8">
          <Link
            href="/editions"
            className="text-xs font-semibold uppercase tracking-[0.25em] text-white/55 transition-colors hover:text-oma-gold"
          >
            ← The Archive
          </Link>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-oma-gold">
            Edition {edition.number} · {edition.dateLabel}
          </p>
          <h1 className="mt-4 max-w-3xl font-canela text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="mt-5 text-sm uppercase tracking-[0.2em] text-white/75">
            {edition.city}
            {edition.venue ? ` · ${edition.venue}` : ""} · {edition.country}
          </p>
        </div>
      </div>
    </section>
  );
}
