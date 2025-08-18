import React, { useState, useEffect, useRef } from "react";
import { Button } from "./button";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AuthImage } from "./auth-image";
import "@/styles/hero-animations.css";

interface CarouselProps {
  items: {
    id: string | number;
    image: string;
    title: string;
    subtitle?: string;
    link?: string;
    heroTitle?: string;
    isEditorial?: boolean;
    width?: number;
    height?: number;
  }[];
  autoplay?: boolean;
  interval?: number;
  className?: string;
  imageClassName?: string;
  showControls?: boolean;
  showIndicators?: boolean;
  aspectRatio?: "video" | "square" | "portrait" | "wide" | "auto";
  overlay?: boolean;
  heroTitleClassName?: string;
}

export function Carousel({
  items,
  autoplay = false,
  interval = 5000,
  className,
  imageClassName,
  showControls = true,
  showIndicators = true,
  aspectRatio = "wide",
  overlay = true,
  heroTitleClassName,
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const timeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const aspectRatioClasses = {
    video: "aspect-video",
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    wide: "aspect-[16/9]",
    auto: "aspect-auto",
  };

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollPosition = window.scrollY;
        const containerTop = containerRef.current.offsetTop;
        const containerHeight = containerRef.current.offsetHeight;

        if (scrollPosition <= containerHeight) {
          setScrollOffset(scrollPosition * 0.5); // Adjust the multiplier for parallax intensity
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    resetTimeout();

    if (autoplay) {
      timeoutRef.current = window.setTimeout(() => {
        setCurrentIndex((prevIndex) =>
          prevIndex === items.length - 1 ? 0 : prevIndex + 1
        );
      }, interval);
    }

    return () => {
      resetTimeout();
    };
  }, [currentIndex, autoplay, interval, items.length]);

  const nextSlide = () => {
    resetTimeout();
    setCurrentIndex((prevIndex) =>
      prevIndex === items.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    resetTimeout();
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? items.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    resetTimeout();
    setCurrentIndex(index);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden group min-h-screen",
        className
      )}
    >
      <div className="absolute inset-0 w-full h-full">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out",
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            )}
          >
            <div
              className="relative w-full h-full parallax-scroll"
              style={{ "--scroll-offset": `${scrollOffset}px` } as any}
            >
              <AuthImage
                src={item.image}
                alt={item.title}
                width={item.width}
                height={item.height}
                className={cn(
                  "w-full h-full object-cover",
                  item.isEditorial ? "object-[50%_20%]" : "object-[50%_15%]",
                  "hero-image-transition",
                  imageClassName
                )}
              />
              {overlay && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              )}
            </div>

            {/* Hero content with improved typography and minimal UI */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white z-20 px-4 hero-content-transition">
              {item.heroTitle && (
                <h1
                  className={cn(
                    "font-canela text-6xl md:text-8xl lg:text-9xl mb-6 max-w-5xl mx-auto tracking-tight",
                    heroTitleClassName
                  )}
                >
                  {item.heroTitle}
                </h1>
              )}
              {item.subtitle && (
                <p className="font-light text-xl md:text-2xl max-w-2xl mx-auto mb-12 tracking-wide">
                  {item.subtitle}
                </p>
              )}

              {/* CTA Button - shown when there's a link or after first slide */}
              {(item.link && item.link.trim()) ||
              currentIndex > 0 ||
              !item.isEditorial ? (
                <Button
                  asChild
                  className="bg-white hover:bg-white/90 text-black font-medium px-8 py-6 text-lg tracking-wide"
                >
                  <Link
                    href={
                      item.link && item.link.trim() ? item.link : "/directory"
                    }
                  >
                    {item.isEditorial ? "View Collection" : "Explore Designers"}
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Minimal slide indicators */}
      {showIndicators && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-1 z-20">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "rounded-full transition-all duration-300",
                index === currentIndex
                  ? "bg-white w-0.5 h-0.5"
                  : "bg-white/40 hover:bg-white/60 w-0.5 h-0.5"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Scroll indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 scroll-indicator">
        <ChevronDown className="w-6 h-6 text-white opacity-60" />
      </div>
    </div>
  );
}
