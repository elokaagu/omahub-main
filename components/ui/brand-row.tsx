import {
  ChevronLeft as ArrowLeft,
  ChevronRight as ArrowRight,
} from "lucide-react";
import { Button } from "./button";
import { BrandCard } from "./brand-card";
import { useRef } from "react";

interface Brand {
  id: string;
  name: string;
  image: string;
  category: string;
  location?: string;
  rating?: number;
  isVerified?: boolean;
}

interface BrandRowProps {
  title: string;
  subtitle?: string;
  brands: Brand[];
}

export function BrandRow({ title, subtitle, brands }: BrandRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    const container = rowRef.current;
    if (!container) return;

    const scrollAmount =
      direction === "left" ? -container.offsetWidth : container.offsetWidth;
    container.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
      top: 0,
    });
  };

  return (
    <div className="relative py-6 sm:py-8">
      <div className="mb-4 sm:mb-6 px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl font-normal text-oma-black mb-1">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-oma-cocoa/70">{subtitle}</p>
        )}
      </div>

      <div className="group relative">
        <div
          ref={rowRef}
          className="flex space-x-3 sm:space-x-6 overflow-x-scroll scrollbar-hide snap-x snap-mandatory transition-transform duration-500 ease-out pl-6 lg:pl-8"
        >
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="w-[240px] sm:w-[300px] flex-none snap-start"
            >
              <BrandCard
                {...brand}
                location={brand.location || ""}
                rating={brand.rating || 4.8}
                isVerified={brand.isVerified || false}
              />
            </div>
          ))}
        </div>

        {/* Desktop navigation buttons - hidden on mobile */}
        <Button
          variant="outline"
          size="icon"
          className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 bg-white shadow-md hover:bg-oma-beige/90 hover:scale-105 transition-all duration-300 ease-out min-h-[44px] min-w-[44px]"
          onClick={() => scroll("left")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 bg-white shadow-md hover:bg-oma-beige/90 hover:scale-105 transition-all duration-300 ease-out min-h-[44px] min-w-[44px]"
          onClick={() => scroll("right")}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
