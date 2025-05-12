import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandCardProps {
  id: string;
  name: string;
  image: string;
  category: string;
  location?: string;
  isVerified?: boolean;
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
  isVerified = false,
  rating,
  isPortrait = false,
  className,
}: BrandCardProps) {
  return (
    <Link
      href={`/brand/${id}`}
      className={cn(
        "group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow",
        isPortrait ? "flex gap-6" : "",
        className
      )}
    >
      <div
        className={cn("relative", isPortrait ? "w-48 h-48" : "aspect-[4/5]")}
      >
        <img
          src={image}
          alt={name}
          className={cn(
            "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105",
            isPortrait ? "object-center object-top" : ""
          )}
        />
      </div>
      <div
        className={cn(
          "p-6",
          isPortrait ? "flex-1 flex flex-col justify-center" : ""
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">{name}</h3>
          {isVerified && <CheckCircle className="h-5 w-5 text-oma-plum" />}
        </div>
        <div className="flex items-center gap-2 text-sm text-oma-cocoa">
          <span className="px-2 py-1 bg-oma-beige/50 rounded">{category}</span>
          <span>•</span>
          <span>{location}</span>
          {rating && (
            <>
              <span>•</span>
              <span>★ {rating}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
