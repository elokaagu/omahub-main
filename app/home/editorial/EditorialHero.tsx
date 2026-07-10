import { VimeoBackgroundVideo } from "./VimeoBackgroundVideo";

const HERO_VIDEO_ID = "1206857643";

/**
 * Homepage hero: just the film, full-bleed, no overlay. Streams the HQ
 * upload from Vimeo rather than a locally re-compressed snippet.
 */
export function EditorialHero() {
  return (
    <section className="relative min-h-[92vh] overflow-hidden bg-oma-plum">
      <VimeoBackgroundVideo videoId={HERO_VIDEO_ID} />

      {/* Fade the film into the next section instead of a hard cut */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-oma-beige sm:h-56"
      />
    </section>
  );
}
