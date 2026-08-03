import { VimeoBackgroundVideo } from "./VimeoBackgroundVideo";
import { FilmSectionCopy } from "./FilmSectionCopy";
import { getHeroVideoId } from "@/lib/services/heroVideoSetting";

async function getVimeoPosterUrl(videoId: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(
        `https://vimeo.com/${videoId}`
      )}&width=1280`,
      { next: { revalidate: 60 * 60 * 24 } }
    );
    if (!res.ok) return undefined;
    const data = await res.json();
    if (typeof data.thumbnail_url !== "string") return undefined;
    // Request a sharper frame for the loading poster.
    return data.thumbnail_url.replace(/_\d+x\d+/, "_1280x720");
  } catch (e) {
    console.error("vimeo_oembed_poster_fetch_failed", e);
    return undefined;
  }
}

/**
 * Full-bleed mid-page film section: a short highlight clip from the
 * events, filling the screen the same way the old hero video did. The
 * clip is swappable from Studio > Settings (Homepage Video).
 */
export async function FilmSection() {
  const videoId = await getHeroVideoId();
  const posterUrl = await getVimeoPosterUrl(videoId);

  return (
    <section className="relative min-h-[min(100svh,820px)] overflow-hidden bg-black sm:min-h-screen">
      <VimeoBackgroundVideo videoId={videoId} posterUrl={posterUrl} />

      <div className="relative z-10 flex min-h-[min(100svh,820px)] flex-col items-start justify-end px-4 pb-12 pt-16 sm:min-h-screen sm:px-6 sm:pb-20 sm:pt-24 lg:px-8">
        <FilmSectionCopy />
      </div>
    </section>
  );
}
