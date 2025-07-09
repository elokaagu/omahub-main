"use client";

import Link from "next/link";
import { LazyImage } from "@/components/ui/lazy-image";
import { VideoPlayer } from "@/components/ui/video-player";
import React, { useState, useEffect } from "react";
import {
  FadeIn,
  SlideUp,
  StaggerContainer,
  StaggerItem,
} from "@/app/components/ui/animations";
import { getAllBrands, getBrandsByCategory } from "@/lib/services/brandService";
import { getCollectionsWithBrands } from "@/lib/services/collectionService";
import { getTailorsWithBrands } from "@/lib/services/tailorService";
import { SectionHeader } from "@/components/ui/section-header";
import { CategoryCard } from "@/components/ui/category-card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "@/components/ui/icons";
import {
  getActiveHeroSlides,
  type HeroSlide,
} from "@/lib/services/heroService";
import {
  getActiveSpotlightContent,
  type SpotlightContent,
} from "@/lib/services/spotlightService";
import { subcategories, type Subcategory } from "@/lib/data/directory";
import { Carousel } from "@/components/ui/carousel-custom";
import { Loading } from "@/components/ui/loading";
import { InstantImage } from "@/components/ui/instant-image";
import { occasions, occasionToCategoryMapping } from "@/lib/data/directory";
import {
  getCategoriesForHomepage,
  mapLegacyToUnified,
  getCategoryById,
} from "@/lib/data/unified-categories";
import { FullWidthBrandRow } from "@/components/ui/full-width-brand-row";

interface Brand {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  is_verified: boolean;
  category: string;
}

interface BrandDisplay {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  isVerified: boolean;
  category: string;
}

interface CategoryWithBrands {
  title: string;
  image: string;
  href: string;
  customCta: string;
  brands: BrandDisplay[];
}

interface CarouselItem {
  id: string | number;
  image: string;
  title: string;
  subtitle: string;
  link: string;
  heroTitle: string;
  isEditorial?: boolean;
  width: number;
  height: number;
}

// Dynamic fallback carousel items (will be populated with real data)
let fallbackCarouselItems: CarouselItem[] = [
  {
    id: 1,
    image: "/lovable-uploads/827fb8c0-e5da-4520-a979-6fc054eefc6e.png",
    title: "Collections",
    subtitle: "Shop for an occasion, holiday, or ready to wear piece",
    link: "/collections",
    heroTitle: "New Season",
    isEditorial: true,
    width: 1920,
    height: 1080,
  },
  {
    id: 2,
    image: "/lovable-uploads/bb152c0b-6378-419b-a0e6-eafce44631b2.png",
    title: "Tailored",
    subtitle: "Masters of craft creating perfectly fitted garments",
    link: "/tailors",
    heroTitle: "Bespoke Craft",
    isEditorial: true,
    width: 1920,
    height: 1080,
  },
];

// Function to generate dynamic fallback items
const generateDynamicFallbackItems = async (): Promise<CarouselItem[]> => {
  try {
    const [catalogues, tailors] = await Promise.all([
      getCollectionsWithBrands(),
      getTailorsWithBrands(),
    ]);

    const items: CarouselItem[] = [];

    // Get a random catalogue image
    if (catalogues.length > 0) {
      const randomCatalogue =
        catalogues[Math.floor(Math.random() * catalogues.length)];
      items.push({
        id: 1,
        image: randomCatalogue.image,
        title: "Collections",
        subtitle: "Shop for an occasion, holiday, or ready to wear piece",
        link: "/collections",
        heroTitle: "New Season",
        isEditorial: true,
        width: 1920,
        height: 1080,
      });
    } else {
      // Fallback to original image if no catalogues
      items.push(fallbackCarouselItems[0]);
    }

    // Get a random tailor image
    if (tailors.length > 0) {
      const randomTailor = tailors[Math.floor(Math.random() * tailors.length)];
      items.push({
        id: 2,
        image: randomTailor.image,
        title: "Tailored",
        subtitle: "Masters of craft creating perfectly fitted garments",
        link: "/tailors",
        heroTitle: "Bespoke Craft",
        isEditorial: true,
        width: 1920,
        height: 1080,
      });
    } else {
      // Fallback to original image if no tailors
      items.push(fallbackCarouselItems[1]);
    }

    return items;
  } catch (error) {
    console.error("Error generating dynamic fallback items:", error);
    return fallbackCarouselItems; // Return original fallback items on error
  }
};

// Smart focal point detection for category images
const getCategoryImageFocalPoint = (category: string): string => {
  switch (category.toLowerCase()) {
    case "collections":
      // For collection images with people, use center-top positioning to show faces/upper body centered
      return "object-center object-top";
    case "tailored":
      // Tailored images often show full garments, center positioning works well
      return "object-center";
    default:
      return "object-center";
  }
};

// Map database categories to homepage categories
const mapDatabaseCategoryToHomepage = (dbCategory: string): string => {
  const categoryMap: { [key: string]: string } = {
    Bridal: "Bridal",
    "Ready to Wear": "Ready to Wear",
    "Casual Wear": "Ready to Wear",
    "Formal Wear": "Ready to Wear",
    Accessories: "Accessories",
    Jewelry: "Accessories",
    Couture: "Bridal", // Map Couture to Bridal for homepage display
  };

  return categoryMap[dbCategory] || "Ready to Wear"; // Default to Ready to Wear
};

// Use unified categories for homepage
const getHomepageCategories = (): CategoryWithBrands[] => {
  const unifiedCategories = getCategoriesForHomepage();

  return unifiedCategories.map((category) => ({
    title: category.displayName,
    image: category.homepageImage!,
    href: `/directory?category=${encodeURIComponent(category.displayName)}`,
    customCta: category.homepageCta!,
    brands: [],
  }));
};

// Initial categories
const initialCategories: CategoryWithBrands[] = getHomepageCategories();

// Simple in-memory cache for dynamic images (session-based) - REMOVED
// Caching removed for simplicity and reliability

// Generate dynamic category images for Browse by Category section - SIMPLIFIED
const generateDynamicCategoryImages = async (): Promise<{
  collectionImage: string;
  tailoredImage: string;
}> => {
  const fallbackImages = {
    collectionImage:
      "/lovable-uploads/827fb8c0-e5da-4520-a979-6fc054eefc6e.png",
    tailoredImage: "/lovable-uploads/bb152c0b-6378-419b-a0e6-eafce44631b2.png",
  };

  try {
    console.log("🔍 Fetching catalogues and tailors for dynamic images...");

    // Fetch data with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Timeout")), 3000);
    });

    const results = (await Promise.race([
      Promise.allSettled([getCollectionsWithBrands(), getTailorsWithBrands()]),
      timeoutPromise,
    ])) as PromiseSettledResult<any>[];

    const [cataloguesResult, tailorsResult] = results;

    let collectionImage = fallbackImages.collectionImage;
    let tailoredImage = fallbackImages.tailoredImage;

    // Handle collections
    if (
      cataloguesResult.status === "fulfilled" &&
      cataloguesResult.value.length > 0
    ) {
      const randomCollection =
        cataloguesResult.value[
          Math.floor(Math.random() * cataloguesResult.value.length)
        ];
      if (randomCollection.image) {
        collectionImage = randomCollection.image;
        console.log("✅ Using dynamic collection image:", collectionImage);
      }
    }

    // Handle tailors
    if (
      tailorsResult.status === "fulfilled" &&
      tailorsResult.value.length > 0
    ) {
      const randomTailor =
        tailorsResult.value[
          Math.floor(Math.random() * tailorsResult.value.length)
        ];
      if (randomTailor.image) {
        tailoredImage = randomTailor.image;
        console.log("✅ Using dynamic tailor image:", tailoredImage);
      }
    }

    return { collectionImage, tailoredImage };
  } catch (error) {
    console.error("❌ Error generating dynamic images:", error);
    return fallbackImages;
  }
};

export default function HomeContent() {
  const [categories, setCategories] =
    useState<CategoryWithBrands[]>(initialCategories);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [spotlightContent, setSpotlightContent] =
    useState<SpotlightContent | null>(null);
  const [dynamicFallbackItems, setDynamicFallbackItems] = useState<
    CarouselItem[]
  >(fallbackCarouselItems);
  const [categoryImages, setCategoryImages] = useState({
    collectionImage:
      "/lovable-uploads/827fb8c0-e5da-4520-a979-6fc054eefc6e.png",
    tailoredImage: "/lovable-uploads/bb152c0b-6378-419b-a0e6-eafce44631b2.png",
  });
  const [categoryImagesLoaded, setCategoryImagesLoaded] = useState(false);
  const [occasionImages, setOccasionImages] = useState<{
    [key: string]: string;
  }>({});
  const [occasionLoading, setOccasionLoading] = useState(true);

  // Load dynamic category images - run only once
  useEffect(() => {
    let isMounted = true;

    const loadCategoryImages = async () => {
      try {
        console.log("🖼️ Loading category images...");

        // Set fallback images immediately
        const fallbackImages = {
          collectionImage:
            "/lovable-uploads/827fb8c0-e5da-4520-a979-6fc054eefc6e.png",
          tailoredImage:
            "/lovable-uploads/bb152c0b-6378-419b-a0e6-eafce44631b2.png",
        };

        if (isMounted) {
          console.log("🔧 Setting fallback images:", fallbackImages);
          setCategoryImages(fallbackImages);
          setCategoryImagesLoaded(true);
          console.log("✅ Fallback images set");
        }

        // Try to get dynamic images
        console.log("🔍 Attempting to load dynamic images...");
        const dynamicImages = await generateDynamicCategoryImages();
        console.log("🎯 Dynamic images loaded:", dynamicImages);

        // Update with dynamic images if they're different and component is still mounted
        if (
          isMounted &&
          (dynamicImages.collectionImage !== fallbackImages.collectionImage ||
            dynamicImages.tailoredImage !== fallbackImages.tailoredImage)
        ) {
          console.log("🔄 Updating to dynamic images:", dynamicImages);
          setCategoryImages(dynamicImages);
          console.log("🔄 Updated to dynamic images");
        } else if (isMounted) {
          console.log("📌 Using fallback images (no dynamic images available)");
        }
      } catch (error) {
        console.error("❌ Error loading category images:", error);
        // Fallback images are already set, so we're good
      }
    };

    loadCategoryImages();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - run only once

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
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Use optimized API for better performance
        const [brandsData, heroData, spotlightData, dynamicItems] =
          await Promise.all([
            // Use optimized brands API with minimal fields
            fetch(
              "/api/brands/optimized?limit=50&fields=id,name,image,category,location,is_verified,rating"
            )
              .then((res) => res.json())
              .then((data) => data.brands || [])
              .catch(() => getAllBrands()), // Fallback to original method
            getActiveHeroSlides(),
            getActiveSpotlightContent(),
            generateDynamicFallbackItems(),
          ]);

        // Set dynamic fallback items
        setDynamicFallbackItems(dynamicItems);

        // Process brands data with performance optimization
        const updatedCategories = initialCategories.map((category) => ({
          ...category,
          brands: brandsData
            .filter(
              (brand: any) =>
                mapDatabaseCategoryToHomepage(brand.category) === category.title
            )
            .slice(0, 8) // Limit all categories to 8 brands for consistent display
            .map((brand: any) => ({
              id: brand.id,
              name: brand.name,
              image: brand.image || "/placeholder-image.jpg",
              location: brand.location?.split(",")[0] || "Unknown", // Take just the city name
              rating: brand.rating,
              isVerified: brand.is_verified || false,
              category: brand.category,
            })),
        }));

        setCategories(updatedCategories);
        setHeroSlides(heroData);
        setSpotlightContent(spotlightData);

        // Debug spotlight content
        console.log("🎯 Spotlight data fetched:", spotlightData);
        console.log("🎯 Spotlight content set:", !!spotlightData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load content. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load occasion images - run only once
  useEffect(() => {
    let isMounted = true;

    async function fetchOccasionImages() {
      if (!isMounted) return;

      setOccasionLoading(true);
      const mapping = occasionToCategoryMapping;
      const usedBrandIds = new Set();
      const newImages: any = {};

      // Define better fallback images for each occasion
      const occasionFallbacks = {
        Wedding: "/lovable-uploads/57cc6a40-0f0d-4a7d-8786-41f15832ebfb.png",
        Party: "/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png",
        "Ready to Wear":
          "/lovable-uploads/99ca757a-bed8-422e-b155-0b9d365b58e0.png",
        Vacation: "/lovable-uploads/25c3fe26-3fc4-43ef-83ac-6931a74468c0.png",
      };

      for (const [occasion, category] of Object.entries(mapping)) {
        if (!isMounted) return;

        try {
          const brands = await getBrandsByCategory(category);
          // Filter out brands already used for other occasions
          const availableBrands = brands.filter((b) => !usedBrandIds.has(b.id));

          if (availableBrands.length > 0) {
            // Select a random brand from available ones
            const randomBrand =
              availableBrands[
                Math.floor(Math.random() * availableBrands.length)
              ];
            usedBrandIds.add(randomBrand.id);
            newImages[occasion] =
              randomBrand.image ||
              occasionFallbacks[occasion as keyof typeof occasionFallbacks];
            console.log(
              `✅ Using brand image for ${occasion}:`,
              randomBrand.name,
              newImages[occasion]
            );
          } else {
            // Use fallback if no brands available
            newImages[occasion] =
              occasionFallbacks[occasion as keyof typeof occasionFallbacks];
            console.log(
              `📌 Using fallback for ${occasion} (no brands):`,
              newImages[occasion]
            );
          }
        } catch (error) {
          console.error(`❌ Error fetching brands for ${occasion}:`, error);
          newImages[occasion] =
            occasionFallbacks[occasion as keyof typeof occasionFallbacks];
          console.log(
            `📌 Using fallback for ${occasion} (error):`,
            newImages[occasion]
          );
        }
      }

      if (isMounted) {
        setOccasionImages(newImages);
        setOccasionLoading(false);
        console.log("🎯 Final occasion images:", newImages);
      }
    }

    fetchOccasionImages();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - run only once

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={() => window.location.reload()}>Refresh Page</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
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

      {/* Categories Section */}
      <section className="py-8 px-2 sm:px-4 lg:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-canela text-center mb-8">
            Browse by Category
          </h2>
          {/* Debug info */}
          {process.env.NODE_ENV === "development" && (
            <div className="text-xs text-gray-500 text-center mb-4">
              Debug: Collection Image: {categoryImages.collectionImage} |
              Tailored Image: {categoryImages.tailoredImage}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Collections Card */}
            <div className="relative group overflow-hidden rounded-lg bg-gray-100 min-h-[400px]">
              <Link href="/collections">
                <div className="relative aspect-[3/4]">
                  <img
                    src={categoryImages.collectionImage}
                    alt="Collections"
                    className="w-full h-full object-cover object-center object-top transition-transform duration-300 group-hover:scale-105"
                    onLoad={() =>
                      console.log(
                        "✅ Collection image loaded:",
                        categoryImages.collectionImage
                      )
                    }
                    onError={(e) =>
                      console.error(
                        "❌ Collection image failed:",
                        categoryImages.collectionImage,
                        e
                      )
                    }
                  />
                  <div className="absolute inset-0 bg-black/30 transition-opacity group-hover:bg-black/40" />
                  <div className="absolute bottom-6 left-6 text-white">
                    <h3 className="text-2xl font-canela mb-2">Collections</h3>
                    <p className="text-sm">
                      Shop for an occasion, holiday, or ready to wear piece
                    </p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Tailored Card */}
            <div className="relative group overflow-hidden rounded-lg bg-gray-100 min-h-[400px]">
              <Link href="/tailored">
                <div className="relative aspect-[3/4]">
                  <img
                    src={categoryImages.tailoredImage}
                    alt="Tailored"
                    className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    onLoad={() =>
                      console.log(
                        "✅ Tailored image loaded:",
                        categoryImages.tailoredImage
                      )
                    }
                    onError={(e) =>
                      console.error(
                        "❌ Tailored image failed:",
                        categoryImages.tailoredImage,
                        e
                      )
                    }
                  />
                  <div className="absolute inset-0 bg-black/30 transition-opacity group-hover:bg-black/40" />
                  <div className="absolute bottom-6 left-6 text-white">
                    <h3 className="text-2xl font-canela mb-2">Tailored</h3>
                    <p className="text-sm">
                      Masters of craft creating perfectly fitted garments
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Spotlight Section */}
      {spotlightContent && (
        <section className="py-12 bg-oma-beige relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-oma-plum/10 via-transparent to-transparent opacity-50"></div>
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 relative z-10">
            <FadeIn>
              <SectionHeader
                title={spotlightContent.title}
                subtitle={spotlightContent.subtitle}
                titleClassName="text-2xl md:text-3xl font-canela"
                subtitleClassName="text-base text-oma-cocoa/80"
              />
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mt-8">
              <SlideUp delay={0.2}>
                <div className="rounded-2xl overflow-hidden relative group">
                  {/* Use LazyImage as fallback if video fails or doesn't exist */}
                  {spotlightContent.video_url || true ? (
                    <VideoPlayer
                      videoUrl={
                        spotlightContent.video_url ||
                        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                      }
                      thumbnailUrl={spotlightContent.video_thumbnail}
                      fallbackImageUrl={spotlightContent.main_image}
                      alt={`${spotlightContent.brand_name} collection`}
                      className="w-full h-[500px] transition-transform duration-700 group-hover:scale-105"
                      aspectRatio="3/4"
                      sizes="(max-width: 768px) 100vw, 800px"
                      quality={95}
                      priority={true}
                      autoPlay={true}
                      muted={true}
                      loop={true}
                      controls={false}
                      showPlayButton={false}
                      onVideoError={() => {
                        console.warn(
                          "Video failed to load for spotlight content"
                        );
                      }}
                    />
                  ) : (
                    <LazyImage
                      src={spotlightContent?.main_image || "/placeholder.jpg"}
                      alt={`${spotlightContent?.brand_name || "Brand"} collection`}
                      width={800}
                      height={1000}
                      className="w-full h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
                      aspectRatio="3/4"
                      sizes="(max-width: 768px) 100vw, 800px"
                      quality={85}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-oma-black/70 via-oma-black/30 to-transparent pointer-events-none"></div>
                  <div className="absolute bottom-8 left-8 right-8 text-white pointer-events-none">
                    <p className="font-canela italic text-xl md:text-2xl">
                      &ldquo;
                      {spotlightContent?.brand_quote ||
                        "Discover amazing fashion"}
                      &rdquo;
                    </p>
                  </div>
                </div>
              </SlideUp>

              <SlideUp delay={0.4}>
                <div className="flex flex-col h-full justify-center">
                  <h3 className="font-canela text-3xl md:text-4xl mb-6 text-oma-plum italic">
                    {spotlightContent.brand_name}
                  </h3>
                  <p className="text-oma-cocoa mb-6 text-lg">
                    {spotlightContent.brand_description}
                  </p>

                  <div className="mt-4 flex flex-col gap-6">
                    <div className="p-5 border-l-2 border-oma-gold bg-white/70 rounded-r-lg">
                      <p className="italic text-oma-cocoa/80 text-lg">
                        &ldquo;{spotlightContent.brand_quote}&rdquo;
                      </p>
                      <p className="text-sm text-oma-cocoa/60 mt-2">
                        — {spotlightContent.brand_quote_author}
                      </p>
                    </div>

                    <Button
                      asChild
                      className="bg-oma-plum hover:bg-oma-plum/90 w-fit mt-4"
                    >
                      <Link href={spotlightContent.brand_link}>
                        See the Collection
                      </Link>
                    </Button>
                  </div>
                </div>
              </SlideUp>
            </div>

            {/* Featured Products */}
            {spotlightContent.featured_products &&
              spotlightContent.featured_products.length > 0 && (
                <div className="mt-12">
                  <FadeIn delay={0.2}>
                    <h4 className="font-canela text-xl mb-4 text-oma-cocoa/80">
                      Featured Pieces from {spotlightContent.brand_name}
                    </h4>
                  </FadeIn>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {spotlightContent.featured_products.map((product, i) => (
                      <Link
                        key={i}
                        href={spotlightContent.brand_link}
                        className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 group"
                      >
                        <LazyImage
                          src={product.image}
                          alt={`${spotlightContent.brand_name} ${product.name}`}
                          width={400}
                          height={300}
                          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                          aspectRatio="4/3"
                          sizes="400px"
                          quality={80}
                        />
                        <div className="p-4">
                          <h5 className="font-medium text-oma-black group-hover:text-oma-plum transition-colors">
                            {product.name}
                          </h5>
                          <p className="text-sm text-oma-cocoa/70">
                            {product.collection}
                          </p>
                          <span className="text-sm text-oma-plum mt-2 inline-block">
                            View Collection →
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </section>
      )}

      {/* What are you dressing for section */}
      <section className="py-8 px-2 sm:px-4 lg:px-6 bg-oma-beige/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-canela text-center mb-8">
            What are you dressing for?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Wedding",
                image:
                  occasionImages.Wedding ||
                  "/lovable-uploads/57cc6a40-0f0d-4a7d-8786-41f15832ebfb.png",
                href: "/directory?occasion=Wedding",
              },
              {
                title: "Party",
                image:
                  occasionImages.Party ||
                  "/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png",
                href: "/directory?occasion=Party",
              },
              {
                title: "Ready to Wear",
                image:
                  occasionImages["Ready to Wear"] ||
                  "/lovable-uploads/99ca757a-bed8-422e-b155-0b9d365b58e0.png",
                href: "/directory?occasion=Ready+to+Wear",
              },
              {
                title: "Vacation",
                image:
                  occasionImages.Vacation ||
                  "/lovable-uploads/25c3fe26-3fc4-43ef-83ac-6931a74468c0.png",
                href: "/directory?occasion=Vacation",
              },
            ].map((occasion, index) => (
              <Link key={index} href={occasion.href} className="group">
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  <LazyImage
                    src={occasion.image}
                    alt={occasion.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 280px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    aspectRatio="square"
                    quality={80}
                  />
                  <div className="absolute inset-0 bg-black/30 transition-opacity group-hover:bg-black/40" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-medium">{occasion.title}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Categories - Full Width */}
      {categories.length > 0 ? (
        categories
          .filter((category) => {
            // Show categories with 4+ brands to ensure quality content
            return category.brands.length >= 4;
          })
          .map((category, index) => (
            <section
              key={category.title}
              className={`py-6 sm:py-8 ${
                index % 2 === 0 ? "bg-white" : "bg-oma-beige/20"
              }`}
            >
              <FadeIn delay={0.1}>
                <FullWidthBrandRow
                  title={category.title}
                  subtitle={category.customCta}
                  brands={category.brands.map((brand) => ({
                    id: brand.id,
                    name: brand.name,
                    image: brand.image,
                    category: brand.category,
                    location: brand.location,
                    rating: brand.rating,
                    isVerified: brand.isVerified,
                  }))}
                />
              </FadeIn>

              {/* View All Button */}
              <SlideUp delay={0.3}>
                <div className="mt-4 text-center px-2 sm:px-4 lg:px-6">
                  <Button
                    asChild
                    variant="outline"
                    className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white min-h-[44px] text-sm sm:text-base"
                  >
                    <Link
                      href={`/directory?category=${encodeURIComponent(
                        category.title
                      )}`}
                    >
                      View All {category.title}
                    </Link>
                  </Button>
                </div>
              </SlideUp>
            </section>
          ))
      ) : (
        <section className="py-8 bg-oma-cream">
          <div className="px-2 sm:px-4 lg:px-6">
            <FadeIn>
              <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-sm max-w-7xl mx-auto">
                <p className="text-oma-cocoa text-lg">
                  Loading brand categories...
                </p>
              </div>
            </FadeIn>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-8 sm:py-10 px-2 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <FadeIn delay={0.1}>
            <div className="bg-gradient-to-r from-oma-plum/10 to-oma-gold/10 rounded-xl p-6 sm:p-8 md:p-12 text-center">
              <h2 className="font-canela text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4">
                Ready to Create Something Beautiful?
              </h2>
              <p className="text-sm sm:text-lg max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed">
                Join our community of fashion enthusiasts and talented designers
                bringing creativity to the world.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center">
                <Button
                  asChild
                  className="bg-oma-plum hover:bg-oma-plum/90 min-h-[44px] text-sm sm:text-base"
                >
                  <Link href="/directory">Browse Brand Directory</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white min-h-[44px] text-sm sm:text-base"
                >
                  <Link href="/join">Become a Designer</Link>
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
