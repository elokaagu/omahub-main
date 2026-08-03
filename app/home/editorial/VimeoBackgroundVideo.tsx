"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Player from "@vimeo/player";
import { cn } from "@/lib/utils";

type VimeoBackgroundVideoProps = {
  videoId: string;
  posterUrl?: string;
};

function buildEmbedUrl(videoId: string) {
  const params = new URLSearchParams({
    background: "1",
    autoplay: "1",
    loop: "1",
    muted: "1",
    autopause: "0",
    playsinline: "1",
    controls: "0",
    title: "0",
    byline: "0",
    portrait: "0",
  });
  return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
}

async function fetchPosterFromOembed(videoId: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(
        `https://vimeo.com/${videoId}`
      )}&width=1280`
    );
    if (!res.ok) return undefined;
    const data = await res.json();
    if (typeof data.thumbnail_url !== "string") return undefined;
    return data.thumbnail_url.replace(/_\d+x\d+/, "_1280x720");
  } catch {
    return undefined;
  }
}

/**
 * Full-bleed background Vimeo player for the homepage film section.
 *
 * Reliability first:
 * - Poster sits above the iframe and only fades once playback is confirmed
 * - Iframe is never hidden at opacity 0 (avoids permanent black screens)
 * - Client-side poster fallback if the server oembed fetch failed
 * - 4s fallback reveals the iframe even if Player events never fire
 */
export function VimeoBackgroundVideo({
  videoId,
  posterUrl: serverPosterUrl,
}: VimeoBackgroundVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<Player | null>(null);

  const [shouldEmbed, setShouldEmbed] = useState(false);
  const [posterUrl, setPosterUrl] = useState(serverPosterUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const embedUrl = useMemo(() => buildEmbedUrl(videoId), [videoId]);

  useEffect(() => {
    setPosterUrl(serverPosterUrl);
  }, [serverPosterUrl]);

  useEffect(() => {
    setPrefersReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  // Client-side poster fallback when the server-side oembed fetch failed.
  useEffect(() => {
    if (posterUrl) return;
    let cancelled = false;
    void fetchPosterFromOembed(videoId).then((url) => {
      if (!cancelled && url) setPosterUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [videoId, posterUrl]);

  // Warm poster cache.
  useEffect(() => {
    if (!posterUrl) return;
    const img = new Image();
    img.src = posterUrl;
  }, [posterUrl]);

  // Mount the iframe when the section is near the viewport.
  useEffect(() => {
    if (prefersReducedMotion) return;

    const node = containerRef.current;
    if (!node) return;

    const activate = () => setShouldEmbed(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          activate();
          observer.disconnect();
        }
      },
      { rootMargin: "500px 0px", threshold: 0 }
    );

    observer.observe(node);

    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight + 500) {
      activate();
    }

    return () => observer.disconnect();
  }, [prefersReducedMotion, videoId]);

  // Player API: confirm playback + mute toggle.
  useEffect(() => {
    if (!shouldEmbed || !iframeRef.current) return;

    let cancelled = false;
    let player: Player | null = null;

    const markPlaying = () => {
      if (!cancelled) setIsPlaying(true);
    };

    const fallbackTimer = window.setTimeout(markPlaying, 4000);

    try {
      player = new Player(iframeRef.current);
      playerRef.current = player;

      player.on("playing", markPlaying);
      player.on("play", markPlaying);

      void player.play().then(markPlaying).catch(() => {
        /* Autoplay may be blocked — poster remains until user interacts */
      });
    } catch (err) {
      console.error("vimeo_player_init_failed", err);
      markPlaying();
    }

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
      if (player) {
        player.off("playing", markPlaying);
        player.off("play", markPlaying);
        void player.destroy().catch(() => {});
      }
      playerRef.current = null;
    };
  }, [shouldEmbed, videoId]);

  const toggleMute = useCallback(async () => {
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
      console.error("vimeo_mute_toggle_failed", err);
    }
  }, [muted]);

  const showPosterOverlay = Boolean(posterUrl) && (!isPlaying || prefersReducedMotion);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-black">
      {shouldEmbed && !prefersReducedMotion && (
        <iframe
          ref={iframeRef}
          key={videoId}
          src={embedUrl}
          title="Art Of Adornment, OmaHub short film"
          allow="autoplay; fullscreen; picture-in-picture"
          className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
        />
      )}

      {posterUrl ? (
        <img
          src={posterUrl}
          alt=""
          aria-hidden
          className={cn(
            "absolute inset-0 z-[2] h-full w-full object-cover transition-opacity duration-700 ease-out",
            showPosterOverlay ? "opacity-100" : "opacity-0"
          )}
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 z-[2] bg-gradient-to-b from-oma-plum/40 to-black"
        />
      )}

      {shouldEmbed && !prefersReducedMotion && (
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Unmute video" : "Mute video"}
          aria-pressed={!muted}
          className="absolute bottom-4 left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oma-gold sm:bottom-6 sm:left-6"
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
      )}
    </div>
  );
}
