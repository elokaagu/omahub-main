"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Tall portrait film card for the editorial hero. Deferred until after
 * mount so the video does not compete with hero text/fonts on first paint.
 */
export function HeroFilmCard() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setShouldLoad(true);
  }, []);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-oma-gold/50 bg-oma-black/20 shadow-2xl",
        "h-[min(88vw,420px)] sm:h-[min(72vw,480px)] lg:h-[min(78vh,680px)]"
      )}
    >
      {shouldLoad && (
        <video
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out",
            isReady
              ? "scale-100 opacity-100 blur-none"
              : "scale-105 opacity-0 blur-lg"
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
