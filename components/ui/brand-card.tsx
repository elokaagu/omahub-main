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
        "group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow relative h-full min-h-[44px]",
        isPortrait ? "flex gap-3 sm:gap-6" : "",
        className
      )}
    >
      <div
        className={cn(
          "relative w-full h-full",
          isPortrait
            ? "w-32 h-32 sm:w-48 sm:h-48 flex-shrink-0"
            : "aspect-[4/5]"
        )}
      >
        <AuthImage
          src={image || "/placeholder.svg"}
          alt={name}
          width={800}
          height={1000}
          className={cn(
            "absolute inset-0 w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105",
            isPortrait ? "object-center object-top" : ""
          )}
        />
      </div>
      <div
        className={cn(
          "p-3 sm:p-6",
          isPortrait ? "flex-1 flex flex-col justify-center" : ""
        )}
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-sm sm:text-lg leading-tight line-clamp-2 pr-2">
            {name}
          </h3>
          {isVerified && (
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-oma-plum flex-shrink-0" />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-oma-cocoa">
          {/* Removed category display */}
          <span className="hidden sm:inline">•</span>
          <span className="truncate">{location}</span>
          <span className="hidden sm:inline">•</span>
          {/* Only show star and rating if rating > 0 */}
          {rating > 0 && (
            <div className="flex items-center flex-shrink-0">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500 mr-1" />
              <span>{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </NavigationLink>
  );
}
