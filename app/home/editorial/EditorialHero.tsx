import { VimeoBackgroundVideo } from "./VimeoBackgroundVideo";

const HERO_VIDEO_ID = "1206857643";

async function getVimeoPosterUrl(videoId: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(
        `https://vimeo.com/${videoId}`
      )}&width=1920`,
      { next: { revalidate: 60 * 60 * 24 } }
    );
    if (!res.ok) return undefined;
    const data = await res.json();
    return typeof data.thumbnail_url === "string"
      ? data.thumbnail_url
      : undefined;
  } catch (e) {
    console.error("vimeo_oembed_poster_fetch_failed", e);
    return undefined;
  }
}

/**
 * Homepage hero: just the film, full-bleed, no overlay. Streams the HQ
 * upload from Vimeo rather than a locally re-compressed snippet. A static
 * poster frame (fetched via Vimeo's oEmbed API) paints instantly behind the
 * iframe so there's no blank/plum flash while the player boots up.
 */
export async function EditorialHero() {
  const posterUrl = await getVimeoPosterUrl(HERO_VIDEO_ID);

  return (
    <section className="relative min-h-screen overflow-hidden bg-oma-plum">
      <VimeoBackgroundVideo videoId={HERO_VIDEO_ID} posterUrl={posterUrl} />
    </section>
  );
}
