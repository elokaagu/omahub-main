import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { LazyImage } from "./lazy-image";
import { CheckCircle, Star } from "@/components/ui/icons";
import { NavigationLink } from "./navigation-link";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/app/components/ui/animations";

interface Brand {
  id: string;
  name: string;
  image: string;
  category: string;
  location: string;
  rating: number;
  isVerified: boolean;
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
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  // Update scroll indicators
  const updateScrollIndicators = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  };

  // Auto-scroll functionality with smoother motion
  const startAutoScroll = () => {
    if (!scrollRef.current || isHovered) return;

    setIsAutoScrolling(true);
    autoScrollRef.current = setInterval(() => {
      if (!scrollRef.current || isHovered) return;

      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

      // If we've reached the end, scroll back to the beginning
      if (scrollLeft + clientWidth >= scrollWidth - 1) {
        scrollRef.current.scrollTo({
          left: 0,
          behavior: "smooth",
        });
      } else {
        // Scroll by one card width with smoother timing and easing
        const cardWidth = window.innerWidth < 768 ? 280 : 320;
        const targetScroll = scrollLeft + cardWidth;

        // Use a more sophisticated scroll with custom easing
        scrollRef.current.scrollTo({
          left: targetScroll,
          behavior: "smooth",
        });
      }
    }, 6000); // Increased to 6 seconds for the smoothest feel
  };

  const stopAutoScroll = () => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
    }
    setIsAutoScrolling(false);
  };

  useEffect(() => {
    updateScrollIndicators();
    const handleResize = () => updateScrollIndicators();
    window.addEventListener("resize", handleResize);

    // Start auto-scroll after a delay
    const startDelay = setTimeout(() => {
      startAutoScroll();
    }, 2000);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(startDelay);
      stopAutoScroll();
    };
  }, [brands, isHovered]);

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
      {/* Section Header aligned with logo */}
      <div className="px-6 lg:px-8 mb-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-canela text-oma-black mb-2">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm sm:text-base text-oma-cocoa/80 max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {/* Scrollable Brand Row - Left Aligned */}
      <div
        className="relative group"
        onMouseEnter={() => {
          setIsHovered(true);
          stopAutoScroll();
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          startAutoScroll();
        }}
      >
        <div
          ref={scrollRef}
          onScroll={updateScrollIndicators}
          className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-4 brand-row-scroll pl-6 lg:pl-8"
          style={
            {
              // Show exactly 6 cards on desktop, fewer on smaller screens
              // Card width + gap = ~320px + 24px = 344px per card
              // 6 cards = ~2064px, so we need viewport width consideration
            }
          }
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
                <NavigationLink
                  href={`/brand/${brand.id}`}
                  className="block group/card"
                >
                  <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02]">
                    {/* Image */}
                    <div className="aspect-[4/5] relative overflow-hidden">
                      <LazyImage
                        src={brand.image}
                        alt={brand.name}
                        fill
                        sizes="(max-width: 768px) 280px, (max-width: 1024px) 300px, 320px"
                        className="object-cover transition-transform duration-500 group-hover/card:scale-110"
                        aspectRatio="4/5"
                        quality={85}
                        priority={index < 6} // Prioritize first 6 images
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />

                      {/* Hover Content */}
                      <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 group-hover/card:translate-y-0 opacity-0 group-hover/card:opacity-100 transition-all duration-300">
                        <p className="text-white text-sm font-medium">
                          View Collection
                        </p>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-lg line-clamp-2 pr-2 text-oma-black group-hover/card:text-oma-plum transition-colors duration-200">
                          {brand.name}
                        </h3>
                        {brand.isVerified && (
                          <CheckCircle className="h-5 w-5 text-oma-plum flex-shrink-0 mt-0.5" />
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-sm text-oma-cocoa mb-2">
                        <span className="px-2 py-1 bg-oma-beige/60 rounded text-xs font-medium">
                          {brand.category}
                        </span>
                        <span className="text-oma-cocoa/60">•</span>
                        <span className="truncate">{brand.location}</span>
                      </div>

                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-amber-500 mr-1" />
                        <span className="text-sm font-medium text-oma-cocoa">
                          {brand.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </NavigationLink>
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
