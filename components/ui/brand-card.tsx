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
        {/* Overlay content at the bottom */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 flex flex-col gap-1">
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
          <div className="flex items-center gap-2 text-xs text-white/80">
            <span className="truncate">{location}</span>
            {rating > 0 && (
              <span className="flex items-center ml-2">
                <Star className="h-3 w-3 text-amber-400 mr-1" />
                {rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>
    </NavigationLink>
  );
}
