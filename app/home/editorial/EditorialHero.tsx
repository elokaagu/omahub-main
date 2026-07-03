import Link from "next/link";
import type { Edition } from "@/lib/data/editions";
import { EmailCaptureForm } from "./EmailCaptureForm";

type EditorialHeroProps = {
  upcomingEdition: Edition | null;
  latestPastEdition: Edition | null;
};

/**
 * Between-editions hero: cinematic, editorial, no shop in sight. The only
 * CTA is the email capture for early access to the next edition.
 */
export function EditorialHero({
  upcomingEdition,
  latestPastEdition,
}: EditorialHeroProps) {
  const eyebrow = upcomingEdition
    ? `Edition ${upcomingEdition.number} — Coming ${upcomingEdition.dateLabel}`
    : "OmaHub — Between Editions";

  return (
    <section className="relative overflow-hidden bg-oma-plum text-white">
      {/* Subtle diagonal grid, per the editorial mockup */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent, transparent 46px, #D4B285 46px, #D4B285 47px), repeating-linear-gradient(-45deg, transparent, transparent 46px, #D4B285 46px, #D4B285 47px)",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-center px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[3fr_2fr]">
          <div>
            <div className="mb-10 flex items-center gap-4">
              <span aria-hidden className="h-px w-12 bg-oma-gold" />
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oma-gold sm:text-sm">
                {eyebrow}
              </p>
            </div>

            <h1 className="font-canela text-5xl leading-[1.05] sm:text-7xl lg:text-8xl">
              Something{" "}
              <em className="italic text-oma-gold">beautiful</em>
              <br />
              is in the edit.
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/80">
              OmaHub is between editions. The next drop spotlights African
              designers you need to know — verified, curated, and ready to
              wear. Get early access.
            </p>

            {upcomingEdition?.applicationsOpen && (
              <p className="mt-8 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-oma-gold">
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full bg-oma-gold"
                />
                Applications open for Edition {upcomingEdition.number}
              </p>
            )}

            <div className="mt-8">
              <EmailCaptureForm
                source="website"
                variant="dark"
                buttonLabel="Notify me"
                successMessage="You're in. Early access details land in your inbox first."
              />
            </div>

            {latestPastEdition && (
              <Link
                href={`/editions/${latestPastEdition.slug}`}
                className="mt-10 inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-white/60 transition-colors hover:text-oma-gold"
              >
                Watch — OmaHub Edition {latestPastEdition.number}
                <span aria-hidden>→</span>
              </Link>
            )}
          </div>

          {/* Poster card for the next edition */}
          {upcomingEdition && (
            <div className="hidden justify-end lg:flex">
              <div className="relative flex aspect-[3/4] w-full max-w-sm flex-col justify-between overflow-hidden border border-oma-gold/30 bg-gradient-to-b from-white/[0.04] to-oma-gold/10 p-8">
                {/* Ghosted campaign image, kept dim while the theme stays under wraps */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-cover bg-center opacity-40"
                  style={{
                    backgroundImage:
                      "url(/images/editions/next-edition-poster.jpg)",
                  }}
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-oma-plum via-oma-plum/50 to-oma-plum/20"
                />
                <div
                  aria-hidden
                  className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-oma-gold/30"
                />
                <p className="relative text-xs font-semibold uppercase tracking-[0.3em] text-oma-gold">
                  OmaHub — {upcomingEdition.city}
                </p>

                <p
                  aria-hidden
                  className="absolute bottom-8 right-8 top-8 flex items-center text-[10px] uppercase tracking-[0.4em] text-oma-gold/70 [writing-mode:vertical-rl]"
                >
                  African Fashion · Curated
                </p>

                <div className="relative">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oma-gold">
                    Next edition
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-4">
                    <p className="font-canela text-3xl">
                      {upcomingEdition.themeAnnounced
                        ? upcomingEdition.title
                        : "TBA"}{" "}
                      · {upcomingEdition.dateLabel}
                    </p>
                    <span className="font-canela text-7xl leading-none text-oma-gold/50">
                      {upcomingEdition.number}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
