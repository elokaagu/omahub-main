import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface InstantImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  aspectRatio?: "square" | "video" | "portrait" | "landscape" | string;
  quality?: number;
  sizes?: string;
  fill?: boolean;
}

export function InstantImage({
  src,
  alt,
  width = 500,
  height = 500,
  className = "",
  aspectRatio,
  quality = 85,
  sizes,
  fill = false,
}: InstantImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [useRegularImg, setUseRegularImg] = useState(false);

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
    "relative overflow-hidden",
    getAspectRatioClass(),
    className
  );

  const handleImageLoad = () => {
    console.log("✅ InstantImage loaded:", src);
    setImageLoaded(true);
  };

  const handleImageError = (error: any) => {
    console.error("❌ InstantImage failed to load:", src, error);
    console.log("🔄 Falling back to regular img tag");
    setUseRegularImg(true);
    setImageError(false); // Reset error state for fallback
  };

  const handleRegularImgLoad = () => {
    console.log("✅ Regular img fallback loaded:", src);
    setImageLoaded(true);
  };

  const handleRegularImgError = () => {
    console.error("❌ Regular img fallback also failed:", src);
    setImageError(true);
  };

  if (imageError) {
    return (
      <div className={containerClasses}>
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-sm">Failed to load image</p>
            <p className="text-xs">{src}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}

      {useRegularImg ? (
        <img
          src={src}
          alt={alt}
          className={cn(
            "w-full h-full object-cover",
            imageLoaded ? "opacity-100" : "opacity-0",
            "transition-opacity duration-300"
          )}
          onLoad={handleRegularImgLoad}
          onError={handleRegularImgError}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          className={cn(
            fill ? "object-cover" : "w-full h-full object-cover",
            imageLoaded ? "opacity-100" : "opacity-0",
            "transition-opacity duration-300"
          )}
          priority={true}
          quality={quality}
          sizes={sizes}
          loading="eager"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </div>
  );
}
