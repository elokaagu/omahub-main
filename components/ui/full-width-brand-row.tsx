"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { NavigationLink } from "./navigation-link";
import { cn } from "@/lib/utils";
import { BrandCard } from "./brand-card";

interface Brand {
  id: string;
  name: string;
  image: string;
  category: string;
  location: string;
  rating: number;
  isVerified: boolean;
  video_url?: string;
  video_thumbnail?: string;
  brand_images?: Array<{
    id: string;
    role: string;
    storage_path: string;
    created_at: string;
    updated_at: string;
  }>;
}

interface FullWidthBrandRowProps {
  title: string;
  subtitle?: string;
  brands: Brand[];
  className?: string;
  /** When false, brands render in a contained grid instead of a horizontal scroll row. */
  scrollable?: boolean;
}

export function FullWidthBrandRow({
  title,
  subtitle,
  brands,
  className,
  scrollable = true,
}: FullWidthBrandRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Update scroll indicators
  const updateScrollIndicators = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  };

  useEffect(() => {
    updateScrollIndicators();
    const handleResize = () => updateScrollIndicators();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [brands]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    // Calculate scroll amount - roughly 1.5 cards on mobile, 3 cards on desktop
    const isMobile = window.innerWidth < 768;
    const cardWidth = isMobile ? 280 : 320;
    const cardsToScroll = isMobile ? 1.5 : 3;
    const scrollAmount = cardWidth * cardsToScroll;

    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!brands || brands.length === 0) return null;

  const card = (brand: Brand) => (
    <BrandCard
      id={brand.id}
      name={brand.name}
      image={brand.image}
      category={brand.category}
      location={brand.location}
      isVerified={brand.isVerified}
      rating={brand.rating}
      video_url={brand.video_url}
      video_thumbnail={brand.video_thumbnail}
      brand_images={brand.brand_images}
    />
  );

  return (
    <div className={cn("w-full", scrollable ? "overflow-hidden" : "", className)}>
      {/* Section Header left-aligned with logo and cards */}
      <div className="mx-auto mb-4 max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-2 text-left font-canela text-2xl text-oma-black sm:text-3xl md:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="max-w-2xl text-left text-sm text-oma-cocoa/80 sm:text-base">
            {subtitle}
          </p>
        )}
      </div>

      {scrollable ? (
        /* Scrollable Brand Row - Left aligned with header, right overflows full width */
        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={updateScrollIndicators}
            className="brand-row-scroll flex snap-x snap-mandatory scroll-smooth gap-2 overflow-x-auto pb-4 pl-4 scrollbar-hide sm:gap-3 sm:pl-6 lg:pl-8"
          >
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="flex-none w-[280px] md:w-[300px] lg:w-[320px] snap-start"
              >
                {card(brand)}
              </div>
            ))}

            {/* Show More Card (if there are many brands) */}
            {brands.length > 8 && (
              <div className="flex-none w-[280px] md:w-[300px] lg:w-[320px] snap-start">
                <NavigationLink
                  href={`/directory?category=${encodeURIComponent(title)}`}
                  className="block h-full"
                >
                  <div className="bg-gradient-to-br from-oma-plum/10 to-oma-gold/10 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 h-full flex items-center justify-center min-h-[400px] border-2 border-dashed border-oma-plum/30 hover:border-oma-plum/60">
                    <div className="text-center p-6">
                      <div className="w-16 h-16 rounded-full bg-oma-plum/20 flex items-center justify-center mx-auto mb-4">
                        <ChevronRight className="h-8 w-8 text-oma-plum" />
                      </div>
                      <h3 className="font-semibold text-lg text-oma-plum mb-2">
                        View All
                      </h3>
                      <p className="text-sm text-oma-cocoa">
                        Discover {brands.length}+ more brands
                      </p>
                    </div>
                  </div>
                </NavigationLink>
              </div>
            )}
          </div>

          {/* Mobile / tablet scroll arrows */}
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              aria-label="Scroll brands left"
              className={cn(
                "absolute left-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border-oma-cocoa/20 bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-oma-plum lg:hidden",
                !canScrollLeft && "cursor-not-allowed opacity-50"
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              aria-label="Scroll brands right"
              className={cn(
                "absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border-oma-cocoa/20 bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-oma-plum lg:hidden",
                !canScrollRight && "cursor-not-allowed opacity-50"
              )}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>

          {/* Scroll Indicators */}
          <div className="mt-4 flex justify-center lg:hidden">
            <div className="flex gap-1">
              <div
                className={cn(
                  "h-1 rounded-full transition-all duration-200",
                  canScrollLeft ? "w-2 bg-oma-cocoa/30" : "w-6 bg-oma-plum"
                )}
              />
              <div
                className={cn(
                  "h-1 rounded-full transition-all duration-200",
                  canScrollRight ? "w-2 bg-oma-cocoa/30" : "w-6 bg-oma-plum"
                )}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {brands.map((brand) => (
              <div key={brand.id}>{card(brand)}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
