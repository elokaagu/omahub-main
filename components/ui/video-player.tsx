"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, AlertCircle } from "lucide-react";
import { Button } from "./button";
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
  showPlayButton = true,
}: VideoPlayerProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
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

  // Debug logging for slow loading issues
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("VideoPlayer debug:", {
        videoUrl,
        thumbnailUrl,
        fallbackImageUrl,
        alt,
        isVideoFile: isVideoFile(thumbnailUrl || fallbackImageUrl || ""),
      });
    }
  }, [videoUrl, thumbnailUrl, fallbackImageUrl, alt]);

  // If no video URL is provided, show image fallback
  const shouldShowImage = !videoUrl || hasError;
  const imageToShow = thumbnailUrl || fallbackImageUrl;

  // Auto-show video if autoplay is enabled
  useEffect(() => {
    if (autoPlay && videoUrl && !hasError) {
      setShowVideo(true);
    }
  }, [autoPlay, videoUrl, hasError]);

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

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handlePlayButtonClick = () => {
    if (videoUrl) {
      setShowVideo(true);
    } else {
      togglePlay();
    }
  };

  // Show image if no video or error, or if video hasn't been activated yet
  if (shouldShowImage || (!showVideo && imageToShow)) {
    return (
      <div
        className={cn(
          "relative group overflow-hidden",
          aspectRatioClasses[aspectRatio],
          className
        )}
      >
        {/* Only use LazyImage for actual image files, not video URLs */}
        {imageToShow && !isVideoFile(imageToShow) ? (
          <LazyImage
            src={imageToShow}
            alt={alt}
            fill
            className="object-cover"
            sizes={sizes}
            quality={quality}
            priority={priority}
          />
        ) : (
          // Fallback for video files or missing images
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
            <div className="text-gray-500 text-center">
              <div className="text-2xl mb-2">🎬</div>
              <div className="text-sm">Video Content</div>
            </div>
          </div>
        )}

        {/* Play button overlay if video is available */}
        {videoUrl && showPlayButton && !showVideo && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
            <Button
              onClick={handlePlayButtonClick}
              variant="secondary"
              size="lg"
              className="bg-white/90 hover:bg-white text-black rounded-full p-4 shadow-lg"
            >
              <Play className="h-8 w-8 ml-1" />
            </Button>
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

  // Show video player
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
        {videoUrl && <source src={videoUrl} type="video/mp4" />}
        Your browser does not support the video tag.
      </video>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      {/* Play/Pause button overlay */}
      {!controls && (
        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center transition-colors cursor-pointer">
          <Button
            onClick={togglePlay}
            variant="secondary"
            size="lg"
            className="bg-white/90 hover:bg-white text-black rounded-full p-4 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Play className="h-8 w-8 ml-1" />
          </Button>
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
