import { NavigationLink } from "./navigation-link";
import { CheckCircle, Star } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { AuthImage } from "./auth-image";
import { VideoPlayer } from "./video-player";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import useFavourites from "@/lib/hooks/useFavourites";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface BrandCardProps {
  id: string;
  name: string;
  image: string;
  category: string;
  location: string;
  isVerified: boolean;
  rating?: number;
  isPortrait?: boolean;
  className?: string;
  video_url?: string;
  video_thumbnail?: string;
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
}: BrandCardProps) {
  const { user } = useAuth();
  const { isFavourite, toggleFavourite } = useFavourites();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isFavourited = isFavourite(id, "brand");

  const handleToggleFavourite = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to sign in to save favourites.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await toggleFavourite(id, "brand");

      toast({
        title: isFavourited ? "Removed from favourites" : "Added to favourites",
        description: isFavourited
          ? "Brand has been removed from your favourites."
          : "Brand has been added to your favourites.",
      });
    } catch (error) {
      console.error("Error toggling favourite:", error);
      toast({
        title: "Error",
        description: "Failed to update favourites. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            : "aspect-[4/5] min-h-[340px]"
        )}
      >
        {/* Prioritize video over image - show video if available */}
        {video_url ? (
          <VideoPlayer
            videoUrl={video_url}
            thumbnailUrl={video_thumbnail || image}
            fallbackImageUrl={image}
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
            src={image || "/placeholder.svg"}
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

        {/* Favourite button - positioned in top right */}

        {/* Overlay content at the bottom (always visible) */}
        <div className="absolute bottom-0 left-0 w-full z-20 p-4 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex flex-col gap-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 gap-1 sm:gap-0">
            <h3 className="font-semibold text-lg text-white leading-tight line-clamp-2 pr-2">
              {name}
            </h3>
            {isVerified && (
              <span className="inline-block bg-oma-plum text-white text-xs px-3 py-1 rounded-full sm:ml-2 w-auto min-w-0">
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
