"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The looping film in the hero's video card. Deferred until after mount so
 * it's absent from the initial server-rendered HTML - the browser's preload
 * scanner never discovers it, so it doesn't compete with the hero's
 * text/fonts on first paint. Once the first frame is actually ready to
 * play, it cross-fades from a blurred, slightly scaled-up placeholder into
 * the sharp video.
 */
export function HeroFilmCard() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setShouldLoad(true);
  }, []);

  return (
    <div className="relative aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl border border-oma-gold/50 bg-oma-black/20 shadow-2xl">
      {shouldLoad && (
        <video
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out",
            isReady ? "scale-100 opacity-100 blur-none" : "scale-105 opacity-0 blur-lg"
          )}
          src="/omahub_hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label="OmaHub hero film"
          onLoadedData={() => setIsReady(true)}
        />
      )}
    </div>
  );
}
