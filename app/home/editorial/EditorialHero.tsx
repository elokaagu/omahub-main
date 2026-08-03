import Link from "next/link";
import type { Edition } from "@/lib/data/editions";
import { EmailCaptureForm } from "./EmailCaptureForm";
import { HeroFilmCard } from "./HeroFilmCard";

type EditorialHeroProps = {
  upcomingEdition: Edition | null;
  latestPastEdition: Edition | null;
};

/**
 * Between-editions hero: editorial split layout with copy on the left
 * (~46%) and a tall film card on the right (~54%). On mobile the film
 * card stacks beneath the headline. The only CTA is email capture.
 */
export function EditorialHero({
  upcomingEdition,
  latestPastEdition,
}: EditorialHeroProps) {
  const eyebrow = upcomingEdition
    ? `Edition ${upcomingEdition.number}, coming ${upcomingEdition.dateLabel}`
    : "OmaHub, between editions";

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF1E4] to-oma-beige text-oma-black">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent, transparent 46px, #D4B285 46px, #D4B285 47px), repeating-linear-gradient(-45deg, transparent, transparent 46px, #D4B285 46px, #D4B285 47px)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:px-6 sm:pb-16 sm:pt-[calc(4rem+env(safe-area-inset-top,0px))] lg:px-8 lg:pb-24 lg:pt-24">
        <div className="flex flex-col gap-10 lg:grid lg:min-h-[calc(100svh-6rem)] lg:grid-cols-[minmax(0,46%)_minmax(0,54%)] lg:items-center lg:gap-x-14 xl:gap-x-20">
          <div className="flex flex-col justify-center lg:py-10">
            <div className="mb-6 sm:mb-8 lg:mb-10">
              <p className="text-[0.65rem] font-bold uppercase leading-snug tracking-[0.25em] text-oma-cocoa sm:text-xs sm:tracking-[0.3em]">
                {eyebrow}
              </p>
            </div>

            <h1 className="max-w-[14ch] font-canela text-[2.25rem] leading-[1.08] tracking-tight sm:max-w-[12ch] sm:text-[2.625rem] sm:leading-[1.06] lg:text-[3.25rem] lg:leading-[1.05] xl:text-6xl">
              African fashion,{" "}
              <span className="text-oma-plum">curated for you.</span>
            </h1>

            {/* Hero film — visible on all breakpoints */}
            <div className="mt-8 w-full lg:hidden">
              <HeroFilmCard />
            </div>

            <p className="mt-6 max-w-md text-[0.9375rem] leading-relaxed text-oma-black/70 sm:mt-8 sm:text-base sm:leading-relaxed lg:text-lg">
              OmaHub is between editions. The next drop spotlights African
              designers you need to know, verified, curated, and ready to
              wear. Get early access.
            </p>

            {upcomingEdition?.applicationsOpen && (
              <p className="mt-5 flex items-start gap-3 text-xs font-semibold uppercase leading-snug tracking-[0.18em] text-oma-plum sm:mt-6 sm:text-sm sm:tracking-[0.2em] lg:mt-8">
                <span
                  aria-hidden
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-oma-gold"
                />
                Applications open for Edition {upcomingEdition.number}
              </p>
            )}

            <div className="mt-5 sm:mt-6 lg:mt-8">
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
                className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-oma-cocoa transition-colors hover:text-oma-plum sm:mt-8 sm:text-sm sm:tracking-[0.2em] lg:mt-10"
              >
                Watch, OmaHub Edition {latestPastEdition.number}
                <span aria-hidden>→</span>
              </Link>
            )}
          </div>

          <div className="hidden w-full lg:flex lg:items-center lg:justify-end">
            <HeroFilmCard />
          </div>
        </div>
      </div>
    </section>
  );
}
