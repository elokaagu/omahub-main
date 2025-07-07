"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  AlertCircle,
} from "lucide-react";
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
  controls = true,
  aspectRatio = "16/9",
  sizes = "100vw",
  quality = 80,
  priority = false,
  onVideoLoad,
  onVideoError,
  showPlayButton = true,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // If no video URL is provided, show image fallback
  const shouldShowImage = !videoUrl || hasError;
  const imageToShow = thumbnailUrl || fallbackImageUrl;

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

      const handleLoadedData = () => {
        setIsLoading(false);
        onVideoLoad?.();
      };

      const handleError = () => {
        setHasError(true);
        setIsLoading(false);
        onVideoError?.();
      };

      const handlePlay = () => {
        setIsPlaying(true);
      };

      const handlePause = () => {
        setIsPlaying(false);
      };

      video.addEventListener("loadeddata", handleLoadedData);
      video.addEventListener("error", handleError);
      video.addEventListener("play", handlePlay);
      video.addEventListener("pause", handlePause);

      return () => {
        video.removeEventListener("loadeddata", handleLoadedData);
        video.removeEventListener("error", handleError);
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("pause", handlePause);
      };
    }
  }, [onVideoLoad, onVideoError]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handlePlayButtonClick = () => {
    if (!showVideo && videoUrl) {
      setShowVideo(true);
      // Small delay to ensure video element is rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play();
        }
      }, 100);
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
        <LazyImage
          src={imageToShow || "/placeholder-image.jpg"}
          alt={alt}
          fill
          className="object-cover"
          sizes={sizes}
          quality={quality}
          priority={priority}
        />

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
        src={videoUrl}
        poster={thumbnailUrl}
        autoPlay={autoPlay}
        muted={isMuted}
        loop={loop}
        controls={controls}
        className="w-full h-full object-cover"
        preload="metadata"
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      >
        Your browser does not support the video tag.
      </video>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      )}

      {/* Custom controls overlay (only if controls are disabled) */}
      {!controls && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={togglePlay}
                variant="secondary"
                size="sm"
                className="bg-white/90 hover:bg-white text-black rounded-full p-2"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              <Button
                onClick={toggleMute}
                variant="secondary"
                size="sm"
                className="bg-white/90 hover:bg-white text-black rounded-full p-2"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>

            <Button
              onClick={toggleFullscreen}
              variant="secondary"
              size="sm"
              className="bg-white/90 hover:bg-white text-black rounded-full p-2"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-white">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
            <p className="text-lg font-medium">Video failed to load</p>
            <p className="text-sm text-gray-300">
              Please try refreshing the page
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
