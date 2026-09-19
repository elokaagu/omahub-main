"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_HERO_MEDIA_SRC,
  isHeroVideoSrc,
} from "@/lib/home/heroMedia";

type HeroFilmCardProps = {
  src?: string | null;
};

/**
 * Tall portrait film card for the editorial hero. Deferred until after
 * mount so the media does not compete with hero text/fonts on first paint.
 * Super admins swap the still or looping film from Studio → Settings.
 */
export function HeroFilmCard({ src }: HeroFilmCardProps) {
  const mediaSrc = src?.trim() || DEFAULT_HERO_MEDIA_SRC;
  const isVideo = isHeroVideoSrc(mediaSrc);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setShouldLoad(true);
  }, []);

  useEffect(() => {
    setIsReady(false);
  }, [mediaSrc]);

  const mediaClassName = cn(
    "absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out",
    isReady ? "scale-100 opacity-100 blur-none" : "scale-105 opacity-0 blur-lg"
  );

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-oma-gold/50 bg-oma-black/20 shadow-2xl",
        "h-[min(88vw,420px)] sm:h-[min(72vw,480px)] lg:h-[min(78vh,680px)]"
      )}
    >
      {shouldLoad && isVideo && (
        <video
          key={mediaSrc}
          className={mediaClassName}
          src={mediaSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label="OmaHub hero film"
          onLoadedData={() => setIsReady(true)}
        />
      )}
      {shouldLoad && !isVideo && (
        // Studio-managed stills can be local or remote (Supabase public URLs).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={mediaSrc}
          className={mediaClassName}
          src={mediaSrc}
          alt=""
          onLoad={() => setIsReady(true)}
        />
      )}
    </div>
  );
}
