"use client";

import { useEffect, useRef, useState } from "react";
import Player from "@vimeo/player";
import { cn } from "@/lib/utils";

type VimeoBackgroundVideoProps = {
  videoId: string;
  posterUrl?: string;
};

/**
 * Full-bleed Vimeo background video: streams the actual HQ upload from
 * Vimeo (chromeless background mode: autoplay, muted, looping, no native
 * controls or branding) rather than a locally re-compressed snippet. The
 * iframe is sized with the standard vh/vw cover trick since iframes can't
 * use object-fit. A single mute/unmute icon sits in the corner, since
 * autoplay requires starting muted. An optional poster frame paints behind
 * the iframe so the first frame is instant instead of a blank/plum flash
 * while Vimeo's player boots up; the iframe itself stays transparent until
 * playback actually starts, then cross-fades in over the poster instead of
 * popping in the moment the (still-loading, often blank) player mounts.
 */
export function VimeoBackgroundVideo({
  videoId,
  posterUrl,
}: VimeoBackgroundVideoProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!iframeRef.current) return;
    const player = new Player(iframeRef.current);
    playerRef.current = player;
    const handlePlay = () => setIsPlaying(true);
    player.on("play", handlePlay);
    // Deliberately no player.destroy() here: it physically removes the
    // iframe from the DOM, which breaks the postMessage channel the moment
    // React 18 Strict Mode's dev-only double-invoke (mount -> cleanup ->
    // mount) runs this cleanup. React already removes the iframe node on a
    // genuine unmount, so we just drop our reference to the player.
    return () => {
      player.off("play", handlePlay);
      playerRef.current = null;
    };
  }, []);

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

  return (
    <div className="absolute inset-0 overflow-hidden motion-reduce:hidden">
      {posterUrl && (
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${posterUrl})` }}
        />
      )}
      <iframe
        ref={iframeRef}
        src={`https://player.vimeo.com/video/${videoId}?background=1&autoplay=1&loop=1&muted=1&app_id=122963`}
        title="Art Of Adornment, OmaHub short film"
        allow="autoplay; fullscreen"
        className={cn(
          "absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 scale-[1.03] opacity-0 transition-opacity duration-700 ease-out",
          isPlaying && "opacity-100"
        )}
      />

      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Unmute video" : "Mute video"}
        aria-pressed={!muted}
        className="absolute bottom-6 left-6 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-oma-black/40 text-white backdrop-blur-sm transition-colors hover:bg-oma-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oma-gold"
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
