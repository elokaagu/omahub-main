import { HeroFilm } from "./HeroFilm";

/**
 * Between-editions hero: just the OmaHub short film, full-bleed, cinematic.
 */
export function EditorialHero() {
  return (
    <section className="relative min-h-[92vh] overflow-hidden bg-oma-plum">
      <HeroFilm />
    </section>
  );
}
