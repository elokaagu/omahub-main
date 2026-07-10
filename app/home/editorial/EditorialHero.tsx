import { BackgroundVideo } from "./BackgroundVideo";

/**
 * Homepage hero: just the film, full-bleed, no overlay.
 */
export function EditorialHero() {
  return (
    <section className="relative min-h-[92vh] overflow-hidden bg-oma-plum">
      <BackgroundVideo
        src="/videos/hero-loop.mp4"
        poster="/images/hero-loop-poster.jpg"
      />
    </section>
  );
}
