import Link from "next/link";
import type { Edition } from "@/lib/data/editions";
import { EmailCaptureForm } from "./EmailCaptureForm";

type EditorialHeroProps = {
  upcomingEdition: Edition | null;
  latestPastEdition: Edition | null;
};

/**
 * Between-editions hero: cinematic, editorial, no shop in sight. The only
 * CTA is the email capture for early access to the next edition. The
 * looping film lives further down the page in FilmSection, not here.
 */
export function EditorialHero({
  upcomingEdition,
  latestPastEdition,
}: EditorialHeroProps) {
  const eyebrow = upcomingEdition
    ? `Edition ${upcomingEdition.number}, coming ${upcomingEdition.dateLabel}`
    : "OmaHub, between editions";

  return (
    <section className="relative overflow-hidden bg-oma-cream text-oma-black">
      {/* Subtle diagonal grid, per the editorial mockup */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent, transparent 46px, #D4B285 46px, #D4B285 47px), repeating-linear-gradient(-45deg, transparent, transparent 46px, #D4B285 46px, #D4B285 47px)",
        }}
      />

      {/* Fades the cream background into the beige of the section below */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-oma-beige sm:h-56"
      />

      <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-center px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[3fr_2fr]">
          <div>
            <div className="mb-10 flex items-center gap-4">
              <span aria-hidden className="h-px w-12 bg-oma-gold" />
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oma-cocoa sm:text-sm">
                {eyebrow}
              </p>
            </div>

            <h1 className="font-canela text-5xl leading-[1.05] sm:text-7xl lg:text-8xl">
              African fashion,
              <br />
              <span className="text-oma-plum">curated for you.</span>
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-relaxed text-oma-black/70">
              OmaHub is between editions. The next drop spotlights African
              designers you need to know, verified, curated, and ready to
              wear. Get early access.
            </p>

            {upcomingEdition?.applicationsOpen && (
              <p className="mt-8 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-oma-plum">
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
                variant="light"
                buttonLabel="Notify me"
                successMessage="You're in. Early access details land in your inbox first."
              />
            </div>

            {latestPastEdition && (
              <Link
                href={`/editions/${latestPastEdition.slug}`}
                className="mt-10 inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-oma-cocoa transition-colors hover:text-oma-plum"
              >
                Watch, OmaHub Edition {latestPastEdition.number}
                <span aria-hidden>→</span>
              </Link>
            )}
          </div>

          {/* Hero video for the next edition */}
          <div className="hidden justify-end lg:flex">
            <div className="relative aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl border border-oma-gold/50 bg-oma-black/20 shadow-2xl">
              <video
                className="absolute inset-0 h-full w-full object-cover"
                src="/omahub_hero.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-label="OmaHub hero film"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
