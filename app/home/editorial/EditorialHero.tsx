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
    </section>
  );
}
