import Link from "next/link";
import type { Edition } from "@/lib/data/editions";

/**
 * Archive card per the editorial mockup: plum panel with the edition title,
 * cream panel with location, lineup, and blurb. Upcoming editions render as
 * a dark placeholder with a join-the-list CTA.
 */
export function EditionCard({ edition }: { edition: Edition }) {
  if (edition.status === "upcoming") {
    return (
      <div className="flex aspect-[3/4] flex-col justify-between rounded-2xl bg-oma-plum p-8 text-white">
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
        backgroundImage: `linear-gradient(to top, rgba(30,15,23,0.85), rgba(58,30,45,0.35)), url(${edition.coverImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-oma-cream">
      <Link
        href={`/editions/${edition.slug}`}
        className="relative flex aspect-[3/4] flex-col justify-end overflow-hidden bg-gradient-to-b from-[#5a2f42] to-oma-plum p-6 text-white"
        style={coverStyle}
      >
        <div
          aria-hidden
          className="absolute right-6 top-6 h-20 w-20 rounded-full border border-oma-gold/30 transition-transform duration-500 group-hover:scale-110"
        />
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-oma-gold">
          Edition {edition.number} · {edition.dateLabel}
        </p>
        <h3 className="mt-2 whitespace-pre-line font-canela text-2xl leading-snug sm:text-3xl">
          {edition.cardTitle}
        </h3>
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-baseline justify-between gap-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-oma-cocoa">
          <span>
            {edition.city}
            {edition.venue ? ` · ${edition.venue}` : ""}
          </span>
          {edition.lineupLabel && <span>{edition.lineupLabel}</span>}
        </div>
        <p className="mt-4 flex-1 text-sm leading-relaxed text-oma-black/80">
          {edition.excerpt}
        </p>
        <Link
          href={`/editions/${edition.slug}`}
          className="mt-5 inline-flex w-fit items-center gap-2 border-b border-oma-plum/40 pb-0.5 text-xs font-semibold uppercase tracking-[0.2em] text-oma-plum transition-colors hover:border-oma-plum hover:text-oma-cocoa"
        >
          Read the edition <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}
