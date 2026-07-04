"use client";

import { useEffect, useRef, useState } from "react";
import Player from "@vimeo/player";

const VIDEO_ID = "1206857643";

/**
 * Click-to-play film facade: the poster image loads instantly, the heavy
 * Vimeo iframe/player only mounts once the visitor presses play. Once
 * playing, a mute toggle appears since Vimeo's chromeless background mode
 * hides all native controls.
 */
export function HeroFilm() {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    if (!playing || !iframeRef.current) return;
    const player = new Player(iframeRef.current);
    playerRef.current = player;
    // Deliberately no player.destroy() here: it physically removes the
    // iframe from the DOM, which breaks the postMessage channel the moment
    // React 18 Strict Mode's dev-only double-invoke (mount -> cleanup ->
    // mount) runs this cleanup. React already removes the iframe node on a
    // genuine unmount, so we just drop our reference to the player.
    return () => {
      playerRef.current = null;
    };
  }, [playing]);

  const toggleMute = async () => {
    const player = playerRef.current;
    if (!player) return;
    const nextMuted = !muted;
    try {
      await player.setMuted(nextMuted);
      if (!nextMuted) {
        await player.setVolume(1);
      }
      setMuted(nextMuted);
    } catch (err) {
      console.error("hero_film_toggle_mute_failed", err);
    }
  };

  if (!playing) {
    return (
      <button
        type="button"
        onClick={() => setPlaying(true)}
        aria-label="Play the OmaHub short film"
        className="group relative block aspect-video w-full overflow-hidden rounded-2xl bg-oma-plum"
      >
        <img
          src="/images/hero-film-poster.jpg"
          alt="Art Of Adornment, the OmaHub short film"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-oma-black/20 transition-colors group-hover:bg-oma-black/10" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110 sm:h-20 sm:w-20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="ml-1 h-7 w-7 text-oma-plum sm:h-8 sm:w-8"
              aria-hidden
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      </button>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-oma-plum">
      <iframe
        ref={iframeRef}
        src={`https://player.vimeo.com/video/${VIDEO_ID}?background=1&autoplay=1&loop=1&muted=1&app_id=122963`}
        title="Art Of Adornment, OmaHub short film"
        allow="autoplay; fullscreen"
        className="absolute inset-0 h-full w-full"
      />

      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Unmute video" : "Mute video"}
        aria-pressed={!muted}
        className="absolute bottom-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-oma-black/40 text-white backdrop-blur-sm transition-colors hover:bg-oma-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oma-gold"
      >
        {muted ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>
    </div>
  );
}
