"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The looping film in the hero's video card. Deferred until the card is
 * near the viewport (IntersectionObserver) so the video file doesn't
 * compete with the hero's text/fonts on first paint, then blurs and fades
 * in once the first frame is actually ready to play.
 */
export function HeroFilmCard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl border border-oma-gold/50 bg-oma-black/20 shadow-2xl"
    >
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
