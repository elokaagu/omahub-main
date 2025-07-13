import { NavigationLink } from "./navigation-link";
import { CheckCircle, Star } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { AuthImage } from "./auth-image";

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
}: BrandCardProps) {
  return (
    <NavigationLink
      href={`/brand/${id}`}
      className={cn(
        "block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow relative h-full min-h-[44px] p-0",
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
        {/* Smooth dark overlay on hover */}
        <div className="absolute inset-0 pointer-events-none transition-all duration-300 bg-black/0 hover:bg-black/20 z-10" />
        {/* Overlay content at the bottom (always visible) */}
        <div className="absolute bottom-0 left-0 w-full z-20 p-4 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex flex-col gap-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-lg text-white leading-tight line-clamp-2 pr-2">
              {name}
            </h3>
            {isVerified && (
              <span className="bg-oma-plum text-white text-xs px-3 py-1 rounded-full ml-2">
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
