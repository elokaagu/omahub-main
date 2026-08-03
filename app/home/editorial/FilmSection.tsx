import { VimeoBackgroundVideo } from "./VimeoBackgroundVideo";
import { getHeroVideoId } from "@/lib/services/heroVideoSetting";

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
 * Full-bleed mid-page film section: a short highlight clip from the
 * events, filling the screen the same way the old hero video did. The
 * clip is swappable from Studio > Settings (Homepage Video).
 */
export async function FilmSection() {
  const videoId = await getHeroVideoId();
  const posterUrl = await getVimeoPosterUrl(videoId);

  return (
    <section className="relative min-h-[min(100svh,820px)] overflow-hidden bg-oma-plum sm:min-h-screen">
      <VimeoBackgroundVideo videoId={videoId} posterUrl={posterUrl} />

      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-oma-plum via-oma-plum/40 to-oma-plum/20"
      />

      <div className="relative z-10 flex min-h-[min(100svh,820px)] flex-col items-start justify-end px-4 pb-12 pt-16 sm:min-h-screen sm:px-6 sm:pb-20 sm:pt-24 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-oma-gold sm:text-xs sm:tracking-[0.3em]">
            The short film
          </p>
          <h2 className="mt-2 font-canela text-3xl text-white sm:mt-3 sm:text-4xl lg:text-5xl">
            Art Of Adornment
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-white/80 sm:mt-4 sm:text-lg">
            The designers behind the diaspora&apos;s most exciting labels, in
            their own words.
          </p>
        </div>
      </div>
    </section>
  );
}
