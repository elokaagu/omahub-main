import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { convertToSignedUrl } from "@/lib/services/imageService";
import { cn } from "@/lib/utils";

interface LazyImageProps {
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

export function LazyImage({
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
}: LazyImageProps) {
  const [signedUrl, setSignedUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return; // Skip intersection observer if priority is true

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "50px", // Start loading 50px before the image comes into view
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Get signed URL when image comes into view
  useEffect(() => {
    if (!isInView) return;

    async function getSignedUrl() {
      try {
        setIsLoading(true);
        setHasError(false);

        // Check if it's a Supabase storage URL that needs signing
        if (src.includes("/storage/v1/object/public/")) {
          console.log("🔐 Converting Supabase URL to signed URL:", src);
          const signed = await convertToSignedUrl(src);
          setSignedUrl(signed);
        } else {
          // For static URLs (like /lovable-uploads/) or external URLs, use as-is
          console.log("📸 Using static/external URL directly:", src);
          setSignedUrl(src);
        }
      } catch (err) {
        console.error("❌ Error getting signed URL for:", src, err);
        setHasError(true);
        onError?.();
      }
    }

    getSignedUrl();
  }, [src, isInView, onError]);

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

  // Error state
  if (hasError) {
    return (
      <div ref={imgRef} className={containerClasses}>
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

  // Loading state or not in view yet
  if (!isInView || !signedUrl) {
    return (
      <div ref={imgRef} className={containerClasses}>
        <div className="absolute inset-0 bg-gray-100 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div ref={imgRef} className={containerClasses}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer" />
        </div>
      )}

      {/* Actual image */}
      <Image
        src={signedUrl}
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
