"use client";

import React, { useState, useRef, useEffect } from "react";
import { AlertCircle } from "lucide-react";

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
  showPlayButton?: boolean;
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
  showPlayButton = false,
}: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if the image URL is actually a video file
  const isVideoFile = (url: string) => {
    if (!url) return false;
    const videoExtensions = [
      ".mp4",
      ".mov",
      ".avi",
      ".webm",
      ".mkv",
      ".flv",
      ".wmv",
      ".m4v",
      ".3gp",
    ];
    const lowerUrl = url.toLowerCase();
    return (
      videoExtensions.some((ext) => lowerUrl.includes(ext)) ||
      lowerUrl.includes("/video/") ||
      lowerUrl.includes("video") ||
      lowerUrl.includes("blob:")
    );
  };

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🎬 VideoPlayer:", {
        videoUrl,
        thumbnailUrl,
        fallbackImageUrl,
        alt,
        hasVideo: !!videoUrl,
      });
    }
  }, [videoUrl, thumbnailUrl, fallbackImageUrl, alt]);

  // Aspect ratio classes
  const aspectRatioClasses = {
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    square: "aspect-square",
    "3/4": "aspect-[3/4]",
  };

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;

      const handleLoadStart = () => {
        setIsLoading(true);
        setHasError(false);
      };

      const handleCanPlay = () => {
        setIsLoading(false);
        onVideoLoad?.();
      };

      const handleError = () => {
        setIsLoading(false);
        setHasError(true);
        onVideoError?.();
      };

      video.addEventListener("loadstart", handleLoadStart);
      video.addEventListener("canplay", handleCanPlay);
      video.addEventListener("error", handleError);

      return () => {
        video.removeEventListener("loadstart", handleLoadStart);
        video.removeEventListener("canplay", handleCanPlay);
        video.removeEventListener("error", handleError);
      };
    }
  }, [onVideoLoad, onVideoError]);

  // If we have a video URL, show the video player
  if (videoUrl) {
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
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}

        {/* Error indicator */}
        {hasError && (
          <div className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full">
            <AlertCircle className="h-4 w-4" />
          </div>
        )}
      </div>
    );
  }

  // If no video, show image fallback
  const imageToShow = thumbnailUrl || fallbackImageUrl;
  
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
