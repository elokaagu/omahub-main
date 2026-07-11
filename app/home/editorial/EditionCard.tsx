import Link from "next/link";
import type { Edition } from "@/lib/data/editions";

/**
 * Archive card: the campaign photo fills the entire card, with a plum scrim
 * rising from the bottom to keep the title, metadata, and blurb legible.
 * Upcoming editions render as a dark placeholder with a join-the-list CTA.
 */
export function EditionCard({ edition }: { edition: Edition }) {
  if (edition.status === "upcoming") {
    return (
      <div className="flex min-h-[520px] flex-col justify-between rounded-2xl bg-oma-plum p-8 text-white sm:min-h-[560px]">
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <span
            aria-hidden
            className="flex h-14 w-14 items-center justify-center rounded-full border border-oma-gold/50 text-2xl font-light text-oma-gold"
          >
            +
          </span>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oma-gold">
            Coming {edition.dateLabel}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-oma-gold/80">
            Edition {edition.number}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/80">
            {edition.excerpt}
          </p>
          <Link
            href="/#join-the-list"
            className="mt-4 inline-flex items-center gap-2 border-b border-oma-gold/60 pb-0.5 text-xs font-semibold uppercase tracking-[0.2em] text-oma-gold transition-colors hover:text-white"
          >
            Join the list <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    );
  }

  const coverStyle = edition.coverImage
    ? {
        backgroundImage: `url(${edition.coverImage})`,
        backgroundSize: "cover",
        backgroundPosition: "top center",
      }
    : undefined;

  return (
    <article className="group relative flex min-h-[520px] flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-b from-[#5a2f42] to-oma-plum shadow-sm ring-1 ring-oma-cocoa/10 transition-shadow duration-300 hover:shadow-lg sm:min-h-[560px]">
      {/* Campaign photo, full-bleed behind everything */}
      <div
        aria-hidden
        className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
        style={coverStyle}
      />
      {/* Scrim rising from the bottom so the text stays legible over any photo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-oma-plum/95 via-oma-plum/35 to-transparent"
      />
      <div
        aria-hidden
        className="absolute right-6 top-6 h-20 w-20 rounded-full border border-oma-gold/30 transition-transform duration-500 group-hover:scale-110"
      />

      {/* Whole-card click target; the "Read the edition" link below sits on
          top of it so it remains its own focusable, discoverable link. */}
      <Link
        href={`/editions/${edition.slug}`}
        className="absolute inset-0"
        aria-label={edition.title}
      />

      <div className="relative flex flex-col p-6 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-oma-gold">
          Edition {edition.number} · {edition.dateLabel}
        </p>
        <h3 className="mt-2 whitespace-pre-line font-canela text-2xl leading-snug sm:text-3xl">
          {edition.cardTitle}
        </h3>

        <div className="mt-4 flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
          <span>
            {edition.city}
            {edition.venue ? ` · ${edition.venue}` : ""}
          </span>
          {edition.lineupLabel && (
            <span className="text-oma-gold">{edition.lineupLabel}</span>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-white/85">
          {edition.excerpt}
        </p>
        <Link
          href={`/editions/${edition.slug}`}
          className="relative z-10 mt-5 inline-flex w-fit items-center gap-2 border-b border-oma-gold/50 pb-0.5 text-xs font-semibold uppercase tracking-[0.2em] text-oma-gold transition-colors hover:border-oma-gold hover:text-white"
        >
          Read the edition{" "}
          <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}
