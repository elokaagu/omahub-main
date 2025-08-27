import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { LazyImage } from "./lazy-image";
import { CheckCircle, Star } from "@/components/ui/icons";
import { NavigationLink } from "./navigation-link";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/app/components/ui/animations";
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
}

export function FullWidthBrandRow({
  title,
  subtitle,
  brands,
  className,
}: FullWidthBrandRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

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

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      {/* Section Header left-aligned with logo and cards */}
      <div className="mb-4 max-w-7xl mx-auto px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-canela text-oma-black mb-2 text-left">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm sm:text-base text-oma-cocoa/80 max-w-2xl text-left">
            {subtitle}
          </p>
        )}
      </div>

      {/* Scrollable Brand Row - Left aligned with header, right overflows full width */}
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          ref={scrollRef}
          onScroll={updateScrollIndicators}
          className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-4 brand-row-scroll pl-6 lg:pl-8"
        >
          {brands.map((brand, index) => (
            <FadeIn key={brand.id} delay={index * 0.08}>
              <div
                className="flex-none w-[280px] md:w-[300px] lg:w-[320px] snap-start animate-fade-in"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: "both",
                }}
              >
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
              </div>
            </FadeIn>
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

        {/* Mobile Navigation Arrows */}
        {isHovered && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className={cn(
                "absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm border-oma-cocoa/20 hover:border-oma-plum shadow-lg lg:hidden transition-all duration-200",
                !canScrollLeft && "opacity-50 cursor-not-allowed"
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm border-oma-cocoa/20 hover:border-oma-plum shadow-lg lg:hidden transition-all duration-200",
                !canScrollRight && "opacity-50 cursor-not-allowed"
              )}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* Scroll Indicators */}
      <div className="flex justify-center mt-4 lg:hidden">
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
  );
}
