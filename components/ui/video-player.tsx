"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";

import { LazyImage } from "./lazy-image";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  videoUrl?: string;
  thumbnailUrl?: string;
  fallbackImageUrl?: string;
  alt: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  aspectRatio?: "16/9" | "4/3" | "square" | "3/4";
  sizes?: string;
  quality?: number;
  priority?: boolean;
  onVideoLoad?: () => void;
  onVideoError?: () => void;
  /** Reserved for future UI; playback is still driven by `controls`. */
  showPlayButton?: boolean;
}

/** Only treat URLs as video when they look like real media files (avoids image URLs mis-stored in `video_url`). */
export function isLikelyVideoUrl(url: string): boolean {
  const path = url.split("?")[0].toLowerCase();
  return /\.(mp4|webm|mov|m4v|ogv|avi|mkv|wmv|flv|3gp)(\b|$)/.test(path) ||
    /\.m3u8(\b|$)/.test(path);
}

export function VideoPlayer({
  videoUrl,
  thumbnailUrl,
  fallbackImageUrl,
  alt,
  className = "",
  autoPlay = false,
  muted = true,
  loop = false,
  controls = false,
  aspectRatio = "16/9",
  sizes = "100vw",
  quality = 80,
  priority = false,
  onVideoLoad,
  onVideoError,
  showPlayButton: _showPlayButton = false,
}: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [videoDecodeFailed, setVideoDecodeFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isPlayableVideo = useMemo(
    () => !!videoUrl?.trim() && isLikelyVideoUrl(videoUrl.trim()),
    [videoUrl]
  );

  useEffect(() => {
    setVideoDecodeFailed(false);
    setIsLoading(true);
  }, [videoUrl]);

  const aspectRatioClasses = {
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    square: "aspect-square",
    "3/4": "aspect-[3/4]",
  };

  useEffect(() => {
    if (!isPlayableVideo || !videoRef.current) return;

    const video = videoRef.current;

    const handleLoadStart = () => {
      setIsLoading(true);
      setVideoDecodeFailed(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      onVideoLoad?.();
    };

    const handleError = (e: Event) => {
      console.error("VideoPlayer: decode/load error:", videoUrl, e);
      setIsLoading(false);
      setVideoDecodeFailed(true);
      onVideoError?.();
    };

    const handleLoadedData = () => {
      setIsLoading(false);
    };

    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);
    video.addEventListener("loadeddata", handleLoadedData);

    return () => {
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
      video.removeEventListener("loadeddata", handleLoadedData);
    };
  }, [isPlayableVideo, onVideoLoad, onVideoError, videoUrl]);

  const imageFallbackSrc =
    thumbnailUrl?.trim() ||
    fallbackImageUrl?.trim() ||
    (!isPlayableVideo && videoUrl?.trim()) ||
    "";

  // Mis-tagged row: `video_url` is actually an image — render as image.
  if (videoUrl?.trim() && !isPlayableVideo) {
    if (!imageFallbackSrc) {
      return (
        <div
          className={cn(
            "relative group overflow-hidden bg-gray-200 flex items-center justify-center",
            aspectRatioClasses[aspectRatio],
            className
          )}
        >
          <div className="text-gray-500 text-center">
            <div className="text-2xl mb-2">📷</div>
            <div className="text-sm">No Image</div>
          </div>
        </div>
      );
    }
    return (
      <div
        className={cn(
          "relative group overflow-hidden",
          aspectRatioClasses[aspectRatio],
          className
        )}
      >
        <LazyImage
          src={imageFallbackSrc}
          alt={alt}
          fill
          className="object-cover"
          sizes={sizes}
          quality={quality}
          priority={priority}
        />
      </div>
    );
  }

  if (videoUrl?.trim() && isPlayableVideo && !videoDecodeFailed) {
    return (
      <div
        className={cn(
          "relative group overflow-hidden",
          aspectRatioClasses[aspectRatio],
          className
        )}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          controls={controls}
          playsInline
          preload="metadata"
          style={{ display: "block" }}
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
          <source src={videoUrl} type="video/quicktime" />
          Your browser does not support the video tag.
        </video>

        {isLoading && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
            <p className="rounded-md bg-black/45 px-3 py-1 text-xs font-medium text-white">
              Loading video...
            </p>
          </div>
        )}
      </div>
    );
  }

  // No video, or video failed — show still image
  const imageToShow =
    thumbnailUrl?.trim() ||
    fallbackImageUrl?.trim() ||
    "";

  if (!imageToShow) {
    return (
      <div
        className={cn(
          "relative group overflow-hidden bg-gray-200 flex items-center justify-center",
          aspectRatioClasses[aspectRatio],
          className
        )}
      >
        <div className="text-gray-500 text-center">
          <div className="text-2xl mb-2">📷</div>
          <div className="text-sm">No Image</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative group overflow-hidden",
        aspectRatioClasses[aspectRatio],
        className
      )}
    >
      <LazyImage
        src={imageToShow}
        alt={alt}
        fill
        className="object-cover"
        sizes={sizes}
        quality={quality}
        priority={priority}
      />
    </div>
  );
}
