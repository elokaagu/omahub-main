"use client";

import { useEffect, useRef, useState } from "react";
import Player from "@vimeo/player";
import { cn } from "@/lib/utils";

type VimeoBackgroundVideoProps = {
  videoId: string;
  posterUrl?: string;
};

const QUALITY_PRIORITY = ["4K", "2K", "1080p", "720p", "540p", "360p", "240p"] as const;

async function setHighestQuality(player: Player) {
  try {
    const qualities = await player.getQualities();
    for (const label of QUALITY_PRIORITY) {
      const match = qualities.find(
        (quality) => quality.label === label || quality.id === label
      );
      if (match) {
        await player.setQuality(match.id ?? label);
        return;
      }
    }
  } catch (err) {
    console.error("vimeo_set_quality_failed", err);
  }
}

/**
 * Full-bleed Vimeo background video. The iframe is deferred until the
 * section is approaching the viewport (large root margin) so it does not
 * compete with the hero on first paint, but still has time to buffer
 * before the user scrolls into view. A poster frame shows immediately
 * and cross-fades out once the player reports loaded/playing.
 */
export function VimeoBackgroundVideo({
  videoId,
  posterUrl,
}: VimeoBackgroundVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [muted, setMuted] = useState(true);

  // Warm the poster in the browser cache as soon as this mounts.
  useEffect(() => {
    if (!posterUrl) return;
    const img = new Image();
    img.src = posterUrl;
  }, [posterUrl]);

  // Begin loading the Vimeo iframe well before the section enters view.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "150% 0px 0px 0px", threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad || !iframeRef.current) return;

    const player = new Player(iframeRef.current);
    playerRef.current = player;

    const markReady = () => setIsReady(true);
    const handleLoaded = () => {
      void setHighestQuality(player);
      setIsReady(true);
    };

    player.on("loaded", handleLoaded);
    player.on("play", markReady);

    return () => {
      player.off("loaded", handleLoaded);
      player.off("play", markReady);
      playerRef.current = null;
    };
  }, [shouldLoad, videoId]);

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
      console.error("vimeo_background_toggle_mute_failed", err);
    }
  };

  const iframeSrc = `https://player.vimeo.com/video/${videoId}?background=1&autoplay=1&loop=1&muted=1&autopause=0&playsinline=1&quality=4K&initial_quality=1080p&app_id=122963`;

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      {posterUrl && (
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 bg-cover bg-center transition-opacity duration-500 ease-out",
            isReady ? "opacity-0" : "opacity-100"
          )}
          style={{ backgroundImage: `url(${posterUrl})` }}
        />
      )}

      {shouldLoad && (
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title="Art Of Adornment, OmaHub short film"
          allow="autoplay; fullscreen"
          className={cn(
            "absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 scale-[1.03] transition-opacity duration-500 ease-out motion-reduce:hidden",
            isReady ? "opacity-100" : "opacity-0"
          )}
        />
      )}

      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Unmute video" : "Mute video"}
        aria-pressed={!muted}
        className="absolute bottom-4 left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-oma-black/40 text-white backdrop-blur-sm transition-colors hover:bg-oma-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oma-gold sm:bottom-6 sm:left-6"
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
