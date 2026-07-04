import { HeroFilm } from "./HeroFilm";

/**
 * Mid-page short film section. The poster loads instantly; the Vimeo
 * player itself only loads once a visitor presses play.
 */
export function FilmSection() {
  return (
    <section className="bg-oma-plum py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oma-gold">
          The short film
        </p>
        <h2 className="mt-3 font-canela text-3xl text-white sm:text-4xl">
          Art Of Adornment
        </h2>
        <div className="mt-10">
          <HeroFilm />
        </div>
      </div>
    </section>
  );
}
