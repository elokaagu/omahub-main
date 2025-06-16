import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FastImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  aspectRatio?: "square" | "video" | "portrait" | "landscape" | string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  quality?: number;
  sizes?: string;
  fill?: boolean;
}

export function FastImage({
  src,
  alt,
  width = 500,
  height = 500,
  className = "",
  priority = false,
  aspectRatio,
  fallback,
  onLoad,
  onError,
  quality = 75,
  sizes,
  fill = false,
}: FastImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
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

  // Convert Supabase storage URLs to signed URLs immediately (no async)
  const getImageSrc = (originalSrc: string) => {
    if (originalSrc.includes("/storage/v1/object/public/")) {
      // Convert public URL to signed URL format for better performance
      const urlParts = originalSrc.split("/storage/v1/object/public/");
      if (urlParts.length === 2) {
        const [baseUrl, path] = urlParts;
        return `${baseUrl}/storage/v1/object/sign/${path}?token=signed`;
      }
    }
    return originalSrc;
  };

  // Error state
  if (hasError) {
    return (
      <div className={containerClasses}>
        {fallback || (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center text-gray-400">
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
              <span className="text-xs">Image not available</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {/* Loading shimmer - only show briefly */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer" />
        </div>
      )}

      {/* Next.js Image with built-in lazy loading */}
      <Image
        src={getImageSrc(src)}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        className={cn(
          "transition-opacity duration-200",
          isLoading ? "opacity-0" : "opacity-100",
          fill ? "object-cover" : "w-full h-full object-cover"
        )}
        priority={priority}
        quality={quality}
        sizes={sizes}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={priority ? "eager" : "lazy"}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      />
    </div>
  );
}
