import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LazyImageProps {
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
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

export function LazyImage({
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
  fallback,
  onLoad,
  onError,
  isUploading = false,
  uploadProgress = 0,
}: LazyImageProps) {
  const [imageUrl, setImageUrl] = useState<string>("");
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

  // Process image URL when image comes into view
  useEffect(() => {
    if (!isInView) return;

    async function processImageUrl() {
      try {
        setIsLoading(true);
        setHasError(false);

        console.log("🔍 LazyImage processing URL:", src);

        // Handle object URLs (blob:) immediately without conversion
        if (src.startsWith("blob:")) {
          console.log("📸 Using object URL directly (temporary preview):", src);
          setImageUrl(src);
          return;
        }

        // For all other URLs (including Supabase), use as-is
        // The Supabase URLs are already public and accessible
        console.log("📸 Using URL directly:", src);
        setImageUrl(src);
      } catch (err) {
        console.error("❌ Error processing image URL:", src, err);
        // Don't set error state, just try to use the original URL
        setImageUrl(src);
      }
    }

    processImageUrl();
  }, [src, isInView]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
    console.warn("❌ Image failed to load:", src);
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

  // Error state - show a nice placeholder
  if (hasError) {
    return (
      <div ref={imgRef} className={containerClasses}>
        {fallback || (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-center text-gray-500">
              <svg
                className="mx-auto h-12 w-12 mb-3 text-gray-400"
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
              <p className="text-sm font-medium">Image Coming Soon</p>
              <p className="text-xs text-gray-400 mt-1">We're working on it</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Uploading state - show upload progress (temporarily disabled to fix build)
  if (isUploading) {
    return (
      <div ref={imgRef} className={containerClasses}>
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
          <div className="text-center text-gray-500">
            <p className="text-sm font-medium">Image Loading...</p>
            <p className="text-xs text-gray-400 mt-1">
              {Math.round(uploadProgress)}% complete
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state or not in view yet
  if (!isInView || !imageUrl) {
    return (
      <div ref={imgRef} className={containerClasses}>
        <div className="absolute inset-0 bg-gray-100 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div ref={imgRef} className={containerClasses}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />
        </div>
      )}

      {/* Actual image */}
      <Image
        src={imageUrl}
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
