import { NavigationLink } from "./navigation-link";
import { CheckCircle, Star } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { AuthImage } from "./auth-image";
import { VideoPlayer } from "./video-player";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { brandImageService } from "@/lib/services/brandImageService";

interface BrandCardProps {
  id: string;
  name: string;
  image: string; // Keep for backward compatibility
  category: string;
  location: string;
  isVerified: boolean;
  rating?: number;
  isPortrait?: boolean;
  className?: string;
  video_url?: string;
  video_thumbnail?: string;
  // New props for the normalized system
  brand_images?: Array<{
    id: string;
    role: string;
    storage_path: string;
    created_at: string;
    updated_at: string;
  }>;
  // Add favourite-related props
  isFavourited?: boolean;
  onUnfavourite?: (brandId: string) => void;
  showUnfavouriteButton?: boolean;
}

export function BrandCard({
  id,
  name,
  image,
  category,
  location,
  isVerified,
  rating = 4.8,
  isPortrait = false,
  className,
  video_url,
  video_thumbnail,
  brand_images,
  isFavourited,
  onUnfavourite,
  showUnfavouriteButton,
}: BrandCardProps) {
  const { user } = useAuth();
  const [imageUrl, setImageUrl] = useState<string>(image || "/placeholder.svg");

  // Use new image service if brand_images are provided
  useEffect(() => {
    async function loadImageUrl() {
      if (brand_images && brand_images.length > 0) {
        // Find cover image or use first available
        const coverImage =
          brand_images.find((img) => img.role === "cover") || brand_images[0];
        if (coverImage) {
          try {
            const url = await brandImageService.getBrandImageUrl(
              coverImage.storage_path
            );
            if (url) {
              setImageUrl(url);
            }
          } catch (error) {
            console.warn(`Failed to load image for ${name}:`, error);
            // Fallback to old image prop
            setImageUrl(image || "/placeholder.svg");
          }
        }
      }
    }

    loadImageUrl();
  }, [brand_images, image, name]);

  // Debug logging for slow loading issues
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("BrandCard debug:", {
        brandName: name,
        image: imageUrl,
        video_url,
        video_thumbnail,
        hasVideo: !!video_url,
        brand_images: brand_images?.length || 0,
      });
    }
  }, [name, imageUrl, video_url, video_thumbnail, brand_images]);

  return (
    <NavigationLink
      href={`/brand/${id}`}
      className={cn(
        "group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow relative h-full min-h-[44px] p-0",
        isPortrait ? "flex gap-3 sm:gap-6" : "",
        className
      )}
    >
      <div
        className={cn(
          "relative w-full h-full",
          isPortrait
            ? "w-32 h-32 sm:w-48 sm:h-48 flex-shrink-0"
            : "aspect-[4/5] min-h-[440px]"
        )}
      >
        {/* Prioritize video over image - show video if available */}
        {video_url ? (
          <VideoPlayer
            videoUrl={video_url}
            thumbnailUrl={imageUrl} // Use the main image as thumbnail, not video_thumbnail
            fallbackImageUrl={imageUrl}
            alt={name}
            className={cn(
              "absolute inset-0 w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105",
              isPortrait ? "object-center object-top" : ""
            )}
            aspectRatio={isPortrait ? "square" : "3/4"}
            sizes="(max-width: 768px) 100vw, 400px"
            quality={85}
            priority={false}
            autoPlay={true}
            muted={true}
            loop={true}
            controls={false}
            showPlayButton={false}
            onVideoError={() => {
              console.warn(`Video failed to load for brand: ${name}`);
            }}
          />
        ) : (
          <AuthImage
            src={imageUrl}
            alt={name}
            width={800}
            height={1000}
            className={cn(
              "absolute inset-0 w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105",
              isPortrait ? "object-center object-top" : ""
            )}
          />
        )}
        {/* Smooth dark overlay on hover */}
        <div className="absolute inset-0 pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] bg-black/0 group-hover:bg-black/40 group-hover:backdrop-blur-sm z-10" />

        {/* Unfavourite button - only show if showUnfavouriteButton is true */}
        {showUnfavouriteButton && onUnfavourite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onUnfavourite(id);
            }}
            className="absolute top-3 right-3 z-20 bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition-all duration-200 hover:scale-110"
            aria-label="Remove from favourites"
          >
            <svg
              className="h-4 w-4 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}

        {/* Overlay content at the bottom (always visible) */}
        <div className="absolute bottom-0 left-0 w-full z-20 p-4 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex flex-col gap-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 gap-1 sm:gap-0">
            <h3 className="font-semibold text-lg text-white leading-tight line-clamp-2 pr-2">
              {name}
            </h3>
            {isVerified && (
              // Make the tag only as wide as the text, even on mobile
              <span className="inline-block bg-oma-plum text-white text-xs px-3 py-1 rounded-full sm:ml-2 max-w-[80px] truncate text-center">
                Verified
              </span>
            )}
          </div>
          {/* Removed location and rating */}
        </div>
      </div>
    </NavigationLink>
  );
}
