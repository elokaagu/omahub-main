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
    <section className="relative min-h-screen overflow-hidden bg-oma-plum">
      <VimeoBackgroundVideo videoId={videoId} posterUrl={posterUrl} />

      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-oma-plum via-oma-plum/30 to-transparent"
      />

      <div className="relative z-10 flex min-h-screen flex-col items-start justify-end px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oma-gold">
            The short film
          </p>
          <h2 className="mt-3 font-canela text-4xl text-white sm:text-5xl">
            Art Of Adornment
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/80">
            The designers behind the diaspora&apos;s most exciting labels, in
            their own words.
          </p>
        </div>
      </div>
    </section>
  );
}
