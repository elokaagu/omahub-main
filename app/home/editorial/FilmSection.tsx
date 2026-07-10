import { BackgroundVideo } from "./BackgroundVideo";

/**
 * Full-bleed mid-page film section: designer-interview footage from the
 * short film, filling the screen the same way the hero does, with a CTA
 * through to the full film on YouTube.
 *
 * TODO: swap YOUTUBE_URL for the real video link once it's live.
 */
const YOUTUBE_URL = "https://www.youtube.com/@OmaHub";

export function FilmSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-oma-plum">
      <BackgroundVideo src="/videos/film-section-loop.mp4" />

      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-oma-plum via-oma-plum/40 to-oma-plum/10"
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
          <a
            href={YOUTUBE_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex min-h-[44px] items-center gap-2 border border-oma-gold px-6 text-xs font-semibold uppercase tracking-[0.2em] text-oma-gold transition-colors hover:bg-oma-gold hover:text-oma-plum"
          >
            Watch the full film on YouTube
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
