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
 * (~46%) and a tall film card on the right (~54%). The only CTA is
 * email capture for early access to the next edition.
 */
export function EditorialHero({
  upcomingEdition,
  latestPastEdition,
}: EditorialHeroProps) {
  const eyebrow = upcomingEdition
    ? `Edition ${upcomingEdition.number}, coming ${upcomingEdition.dateLabel}`
    : "OmaHub, between editions";

  return (
    <section className="relative overflow-hidden bg-[#613C3A] text-oma-cream">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent, transparent 46px, #D4B285 46px, #D4B285 47px), repeating-linear-gradient(-45deg, transparent, transparent 46px, #D4B285 46px, #D4B285 47px)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid min-h-[calc(100svh-6rem)] items-center gap-12 lg:grid-cols-[minmax(0,46%)_minmax(0,54%)] lg:gap-x-14 xl:gap-x-20">
          <div className="flex flex-col justify-center lg:py-10">
            <div className="mb-8 flex items-center gap-4 lg:mb-10">
              <span aria-hidden className="h-px w-12 bg-oma-gold" />
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-oma-gold/90 sm:text-sm">
                {eyebrow}
              </p>
            </div>

            <h1 className="max-w-[12ch] font-canela text-[2.625rem] leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.05] xl:text-6xl">
              African fashion,{" "}
              <span className="text-oma-gold">curated for you.</span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-relaxed text-white/75 sm:mt-8 sm:text-lg">
              OmaHub is between editions. The next drop spotlights African
              designers you need to know, verified, curated, and ready to
              wear. Get early access.
            </p>

            {upcomingEdition?.applicationsOpen && (
              <p className="mt-6 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-oma-gold sm:mt-8">
                <span
                  aria-hidden
                  className="h-2 w-2 shrink-0 rounded-full bg-oma-gold"
                />
                Applications open for Edition {upcomingEdition.number}
              </p>
            )}

            <div className="mt-6 sm:mt-8">
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
                className="mt-8 inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-white/70 transition-colors hover:text-oma-gold sm:mt-10"
              >
                Watch, OmaHub Edition {latestPastEdition.number}
                <span aria-hidden>→</span>
              </Link>
            )}
          </div>

          <div className="hidden lg:flex lg:items-center lg:justify-end">
            <HeroFilmCard />
          </div>
        </div>
      </div>
    </section>
  );
}
