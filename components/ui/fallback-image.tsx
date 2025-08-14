import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface FallbackImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  aspectRatio?: "square" | "video" | "portrait" | "landscape" | string;
  quality?: number;
  sizes?: string;
  fill?: boolean;
  fallbackSrc?: string;
}

export function FallbackImage({
  src,
  alt,
  width = 500,
  height = 500,
  className = "",
  priority = false,
  aspectRatio,
  quality = 75,
  sizes,
  fill = false,
  fallbackSrc = "/placeholder-image.jpg",
}: FallbackImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Get aspect ratio classes
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "square":
        return "aspect-square";
      case "video":
        return "aspect-video";
      case "portrait":
        return "aspect-[3/4]";
      case "landscape":
        return "aspect-[4/3]";
      default:
        return aspectRatio ? `aspect-[${aspectRatio}]` : "";
    }
  };

  const containerClasses = cn(
    "relative overflow-hidden bg-gray-100",
    getAspectRatioClass(),
    className
  );

  // If there's an error, show fallback
  if (hasError) {
    return (
      <div className={containerClasses}>
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg
              className="mx-auto h-8 w-8 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm">Image unavailable</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {/* Loading shimmer */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer" />
        </div>
      )}

      {/* Image */}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          fill ? "object-cover" : "w-full h-full object-cover"
        )}
        priority={priority}
        quality={quality}
        sizes={sizes}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={priority ? "eager" : "lazy"}
      />
    </div>
  );
}
