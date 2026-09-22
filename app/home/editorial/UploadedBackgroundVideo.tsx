"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type UploadedBackgroundVideoProps = {
  /** Public URL of a video uploaded in Studio > Homepage. */
  src: string;
  posterUrl?: string;
};

/**
 * Full-bleed background player for a video file uploaded in Studio, the
 * alternative to the Vimeo embed. Muted and looping so it can autoplay;
 * a paused-by-the-browser video still shows its poster frame.
 */
export function UploadedBackgroundVideo({
  src,
  posterUrl,
}: UploadedBackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Some browsers refuse the autoplay attribute but allow a script call.
    videoRef.current?.play().catch(() => {});
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={posterUrl}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
      onCanPlay={() => setReady(true)}
      className={cn(
        "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
        ready ? "opacity-100" : "opacity-0",
      )}
    />
  );
}
