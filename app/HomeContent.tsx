"use client";

import dynamic from "next/dynamic";
import React, { useState, useEffect } from "react";
import type { HeroSlide } from "@/lib/services/heroService";
import type { SpotlightContent } from "@/lib/services/spotlightService";
import { Carousel } from "@/components/ui/carousel-custom";
import {
  buildInitialCategories,
  fallbackCarouselItems,
} from "@/app/home/homepageData";
import { devLog } from "@/app/home/devLog";
import type { CarouselItem, CategoryWithBrands } from "@/app/home/homeTypes";
import type { HomeBootstrapPayload } from "@/lib/home/homeBootstrapTypes";

const HomeLowerSections = dynamic(
  () => import("./home/HomeLowerSections"),
  {
    loading: () => (
      <div
        className="min-h-[40vh] bg-gradient-to-b from-white to-oma-beige/30 animate-pulse"
        aria-hidden
      />
    ),
  }
);

const BOOTSTRAP_CACHE_TTL_MS = 60_000;
let homeBootstrapCache: { at: number; payload: HomeBootstrapPayload } | null =
  null;

const initialCategories: CategoryWithBrands[] = buildInitialCategories();

const STATIC_CATEGORY_IMAGES = {
  collectionImage:
    "/lovable-uploads/827fb8c0-e5da-4520-a979-6fc054eefc6e.png",
  tailoredImage:
    "/lovable-uploads/bb152c0b-6378-419b-a0e6-eafce44631b2.png",
} as const;

type HomeContentProps = {
  initialBootstrap?: HomeBootstrapPayload | null;
};

function hasBootstrap(
  b: HomeBootstrapPayload | null | undefined
): b is HomeBootstrapPayload {
  return !!b && Array.isArray(b.categories) && b.categories.length > 0;
}

export default function HomeContent({
  initialBootstrap = null,
}: HomeContentProps) {
  const seeded = hasBootstrap(initialBootstrap);

  const [categories, setCategories] = useState<CategoryWithBrands[]>(() =>
    seeded ? initialBootstrap!.categories : initialCategories
  );
  const [error, setError] = useState<string | null>(null);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(() =>
    seeded ? initialBootstrap!.heroSlides : []
  );
  const [spotlightContent, setSpotlightContent] =
    useState<SpotlightContent | null>(() =>
      seeded ? initialBootstrap!.spotlightContent : null
    );
  const [dynamicFallbackItems, setDynamicFallbackItems] = useState<
    CarouselItem[]
  >(() =>
    seeded
      ? initialBootstrap!.dynamicFallbackItems
      : fallbackCarouselItems
  );
  const [categoryImages, setCategoryImages] = useState<{
    collectionImage: string;
    tailoredImage: string;
  }>(() =>
    seeded &&
    (initialBootstrap!.categoryImages.collectionImage ||
      initialBootstrap!.categoryImages.tailoredImage)
      ? {
          collectionImage:
            initialBootstrap!.categoryImages.collectionImage ||
            STATIC_CATEGORY_IMAGES.collectionImage,
          tailoredImage:
            initialBootstrap!.categoryImages.tailoredImage ||
            STATIC_CATEGORY_IMAGES.tailoredImage,
        }
      : {
          collectionImage: STATIC_CATEGORY_IMAGES.collectionImage,
          tailoredImage: STATIC_CATEGORY_IMAGES.tailoredImage,
        }
  );
  const [occasionImages, setOccasionImages] = useState<{
    [key: string]: string;
  }>(() => (seeded ? initialBootstrap!.occasionImages ?? {} : {}));

  // Transform hero slides to carousel items
  const carouselItems: CarouselItem[] =
    heroSlides.length > 0
      ? heroSlides.map((slide) => {
          // Use the same flexible link handling as the hero service
          let link = slide.link?.trim() || "/directory";

          // Only add "/" prefix if it's clearly an internal path that needs it
          if (
            link &&
            link !== "/directory" &&
            !link.startsWith("/") &&
            !link.startsWith("http") &&
            !link.includes(".") &&
            !link.includes("?") &&
            !link.includes("#")
          ) {
            // Only add "/" for simple paths like "directory" or "catalogues"
            link = "/" + link;
          }

          return {
            id: slide.id,
            image: slide.image,
            title: slide.title,
            subtitle: slide.subtitle || "",
            link: link,
            heroTitle: slide.hero_title || slide.title,
            isEditorial: slide.is_editorial,
            width: 1920,
            height: 1080,
          };
        })
      : dynamicFallbackItems;

  useEffect(() => {
    if (hasBootstrap(initialBootstrap)) {
      homeBootstrapCache = { at: Date.now(), payload: initialBootstrap };
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setError(null);

        const now = Date.now();
        if (
          homeBootstrapCache &&
          now - homeBootstrapCache.at < BOOTSTRAP_CACHE_TTL_MS
        ) {
          const data = homeBootstrapCache.payload;
          if (cancelled) return;
          setCategories(data.categories);
          setHeroSlides(data.heroSlides);
          setSpotlightContent(data.spotlightContent);
          setDynamicFallbackItems(data.dynamicFallbackItems);
          if (
            data.categoryImages.collectionImage ||
            data.categoryImages.tailoredImage
          ) {
            setCategoryImages({
              collectionImage:
                data.categoryImages.collectionImage ||
                STATIC_CATEGORY_IMAGES.collectionImage,
              tailoredImage:
                data.categoryImages.tailoredImage ||
                STATIC_CATEGORY_IMAGES.tailoredImage,
            });
          }
          setOccasionImages(data.occasionImages ?? {});
          return;
        }

        const res = await fetch("/api/home/bootstrap", {
          credentials: "same-origin",
        });

        if (!res.ok) {
          throw new Error(`bootstrap ${res.status}`);
        }

        const data = (await res.json()) as HomeBootstrapPayload;

        if (cancelled) return;

        homeBootstrapCache = { at: Date.now(), payload: data };

        setCategories(data.categories);
        setHeroSlides(data.heroSlides);
        setSpotlightContent(data.spotlightContent);
        setDynamicFallbackItems(data.dynamicFallbackItems);

        if (
          data.categoryImages.collectionImage ||
          data.categoryImages.tailoredImage
        ) {
          setCategoryImages({
            collectionImage:
              data.categoryImages.collectionImage ||
              STATIC_CATEGORY_IMAGES.collectionImage,
            tailoredImage:
              data.categoryImages.tailoredImage ||
              STATIC_CATEGORY_IMAGES.tailoredImage,
          });
        }

        setOccasionImages(data.occasionImages ?? {});

        devLog(
          "Homepage bootstrap:",
          data.categories.map((c) => ({
            title: c.title,
            brandCount: c.brands.length,
          }))
        );
      } catch (err) {
        console.error("Error fetching homepage bootstrap:", err);
        if (!cancelled) {
          setError("Failed to load content. Please try again.");
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [initialBootstrap]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-red-500 mb-4">{error}</div>
      </div>
    );
  }

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative">
        <Carousel
          items={carouselItems}
          autoplay={true}
          interval={6000}
          className="min-h-screen"
          heroTitleClassName="font-canela text-7xl md:text-9xl mb-4 tracking-tight whitespace-pre-line"
          showIndicators={true}
          showControls={false}
          overlay={false}
        />
      </section>

      <HomeLowerSections
        categories={categories}
        categoryImages={categoryImages}
        spotlightContent={spotlightContent}
        occasionImages={occasionImages}
      />
    </main>
  );
}
