"use client";

import Link from "next/link";
import type { Edition } from "@/lib/data/editions";
import { cn } from "@/lib/utils";

type EditionCardProps = {
  edition: Edition;
  /** Homepage cards show less copy — title, metadata, and CTA only. */
  compact?: boolean;
};

/**
 * Archive card: campaign photo (or plum gradient for upcoming editions)
 * with a dark bottom scrim so title and metadata stay legible.
 */
export function EditionCard({ edition, compact = false }: EditionCardProps) {
  const isUpcoming = edition.status === "upcoming";
  const href = isUpcoming ? "/#join-the-list" : `/editions/${edition.slug}`;
  const ctaLabel = isUpcoming ? "Join the list" : "Read the edition";

  const coverStyle =
    !isUpcoming && edition.coverImage
      ? {
          backgroundImage: `url(${edition.coverImage})`,
          backgroundSize: "cover",
          backgroundPosition: "top center",
        }
      : undefined;

  return (
    <article
      className={cn(
        "group relative flex min-h-[440px] flex-col justify-end overflow-hidden rounded-2xl shadow-sm ring-1 ring-oma-cocoa/10 transition-shadow duration-300 hover:shadow-lg sm:min-h-[520px] lg:min-h-[560px]",
        isUpcoming
          ? "bg-gradient-to-br from-[#735048] to-oma-plum"
          : "bg-gradient-to-b from-[#735048] to-[#613C3A]"
      )}
    >
      {!isUpcoming && (
        <div
          aria-hidden
          className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
          style={coverStyle}
        />
      )}

      {/* Dark scrim — tall enough to protect text on bright photography */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-oma-plum/95 via-oma-plum/60 to-transparent"
      />

      <Link
        href={href}
        className="absolute inset-0 z-[5] rounded-2xl"
        aria-label={
          isUpcoming
            ? `Join the list for Edition ${edition.number}`
            : edition.title
        }
      />

      <div className="relative flex flex-col p-6 text-white [text-shadow:0_2px_14px_rgb(0_0_0_/_50%)] sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-oma-gold">
          Edition {edition.number} ·{" "}
          {isUpcoming ? `Coming ${edition.dateLabel}` : edition.dateLabel}
        </p>

        <h3 className="mt-2 whitespace-pre-line font-canela text-2xl leading-snug sm:text-3xl">
          {isUpcoming && !edition.themeAnnounced
            ? `Edition ${edition.number}`
            : edition.cardTitle}
        </h3>

        {!isUpcoming && (edition.city || edition.lineupLabel) && (
          <div className="mt-4 flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">
            {(edition.city || edition.venue) && (
              <span>
                {edition.city}
                {edition.venue ? ` · ${edition.venue}` : ""}
              </span>
            )}
            {edition.lineupLabel && (
              <span className="text-oma-gold">{edition.lineupLabel}</span>
            )}
          </div>
        )}

        {!compact && !isUpcoming && edition.excerpt && (
          <p className="mt-3 text-sm leading-relaxed text-white/85">
            {edition.excerpt}
          </p>
        )}

        <Link
          href={href}
          className="relative z-10 mt-5 inline-flex w-fit items-center gap-2 border-b border-oma-gold/50 pb-0.5 text-xs font-semibold uppercase tracking-[0.2em] text-oma-gold transition-colors hover:border-oma-gold hover:text-white"
        >
          {ctaLabel}{" "}
          <span
            aria-hidden
            className="transition-transform duration-300 group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      </div>
    </article>
  );
}
