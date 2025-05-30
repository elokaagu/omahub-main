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
    <div className="relative py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-normal text-oma-black mb-1">{title}</h2>
        {subtitle && <p className="text-sm text-oma-cocoa/70">{subtitle}</p>}
      </div>

      <div className="group relative">
        <div
          ref={rowRef}
          className="flex space-x-6 overflow-x-scroll scrollbar-hide snap-x snap-mandatory transition-transform duration-500 ease-out"
        >
          {brands.map((brand) => (
            <div key={brand.id} className="w-[300px] flex-none snap-start">
              <BrandCard {...brand} />
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white shadow-md hover:bg-oma-beige/90 hover:scale-105 transition-all duration-300 ease-out"
          onClick={() => scroll("left")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white shadow-md hover:bg-oma-beige/90 hover:scale-105 transition-all duration-300 ease-out"
          onClick={() => scroll("right")}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
