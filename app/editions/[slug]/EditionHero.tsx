import Image from "next/image";
import Link from "next/link";
import type { Edition } from "@/lib/data/editions";

type EditionHeroProps = {
  edition: Edition;
  coverImage?: string;
};

/**
 * Full-viewport edition hero — one screen tall, no overflow.
 */
export function EditionHero({ edition, coverImage }: EditionHeroProps) {
  const title =
    edition.status === "upcoming" && !edition.themeAnnounced
      ? `Edition ${edition.number}: TBA`
      : edition.title;

  return (
    <section className="relative min-h-[100dvh] min-h-svh max-h-svh w-full overflow-hidden bg-oma-plum">
      {coverImage ? (
        <Image
          src={coverImage}
          alt=""
          fill
          priority
          quality={92}
          sizes="100vw"
          className="object-cover object-[center_22%] sm:object-[center_18%] lg:object-[center_15%]"
          aria-hidden
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-[#735048] to-oma-plum"
        />
      )}

      {/* Scrim — stronger at the bottom on mobile now the beige fade is gone */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10 sm:from-black/75 sm:via-black/25 sm:to-black/5"
      />

      <div className="relative z-10 flex h-full min-h-[inherit] flex-col justify-end pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-7xl px-4 [text-shadow:0_2px_18px_rgb(0_0_0_/_55%)] sm:px-6 lg:px-8">
          <Link
            href="/editions"
            className="inline-flex min-h-[44px] items-center text-xs font-semibold uppercase tracking-[0.25em] text-white/55 transition-colors hover:text-oma-gold"
          >
            ← The Archive
          </Link>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-oma-gold sm:mt-8 sm:text-xs sm:tracking-[0.3em]">
            Edition {edition.number} · {edition.dateLabel}
          </p>
          <h1 className="mt-3 max-w-3xl font-canela text-4xl leading-[1.08] text-white sm:mt-4 sm:text-5xl sm:leading-[1.05] lg:text-7xl">
            {title}
          </h1>
          <p className="mt-4 text-[11px] uppercase leading-relaxed tracking-[0.18em] text-white/75 sm:mt-5 sm:text-sm sm:tracking-[0.2em]">
            {edition.city}
            {edition.venue ? ` · ${edition.venue}` : ""} · {edition.country}
          </p>
        </div>
      </div>
    </section>
  );
}
