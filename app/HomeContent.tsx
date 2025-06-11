"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import {
  FadeIn,
  SlideUp,
  StaggerContainer,
  StaggerItem,
} from "@/app/components/ui/animations";
import { getAllBrands } from "@/lib/services/brandService";
import { getCataloguesWithBrands } from "@/lib/services/catalogueService";
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
    title: "Catalogues",
    subtitle: "Shop for an occasion, holiday, or ready to wear piece",
    link: "/catalogues",
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
      getCataloguesWithBrands(),
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
        title: "Catalogues",
        subtitle: "Shop for an occasion, holiday, or ready to wear piece",
        link: "/catalogues",
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

// Generate dynamic category images for Browse by Category section
const generateDynamicCategoryImages = async (): Promise<{
  catalogueImage: string;
  tailoredImage: string;
}> => {
  try {
    const [catalogues, tailors] = await Promise.all([
      getCataloguesWithBrands(),
      getTailorsWithBrands(),
    ]);

    let catalogueImage =
      "/lovable-uploads/827fb8c0-e5da-4520-a979-6fc054eefc6e.png"; // fallback
    let tailoredImage =
      "/lovable-uploads/bb152c0b-6378-419b-a0e6-eafce44631b2.png"; // fallback

    // Get a random catalogue image
    if (catalogues.length > 0) {
      const randomCatalogue =
        catalogues[Math.floor(Math.random() * catalogues.length)];
      catalogueImage = randomCatalogue.image;
    }

    // Get a random tailor image
    if (tailors.length > 0) {
      const randomTailor = tailors[Math.floor(Math.random() * tailors.length)];
      tailoredImage = randomTailor.image;
    }

    return { catalogueImage, tailoredImage };
  } catch (error) {
    console.error("Error generating dynamic category images:", error);
    return {
      catalogueImage:
        "/lovable-uploads/827fb8c0-e5da-4520-a979-6fc054eefc6e.png",
      tailoredImage:
        "/lovable-uploads/bb152c0b-6378-419b-a0e6-eafce44631b2.png",
    };
  }
};

// Smart focal point detection for category images
const getCategoryImageFocalPoint = (category: string): string => {
  switch (category.toLowerCase()) {
    case "catalogues":
      // Fashion photography typically benefits from top positioning to show faces/styling
      return "object-top";
    case "tailored":
      // Tailoring images often show full garments, center positioning works well
      return "object-center";
    default:
      return "object-center";
  }
};

// Define the categories
const categoryDefinitions = [
  {
    title: "Bridal",
    image: "/lovable-uploads/57cc6a40-0f0d-4a7d-8786-41f15832ebfb.png",
    href: "/directory?category=Bridal",
    customCta: 'Tailored for "Yes."',
  },
  {
    title: "Ready to Wear",
    image: "/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png",
    href: "/directory?category=Ready%20to%20Wear",
    customCta: "Looks for the every day that isn't.",
  },
  {
    title: "Tailoring",
    image: "/lovable-uploads/99ca757a-bed8-422e-b155-0b9d365b58e0.png",
    href: "/directory?category=Tailoring",
    customCta: "Custom fits. Clean lines.",
  },
  {
    title: "Accessories",
    image: "/lovable-uploads/25c3fe26-3fc4-43ef-83ac-6931a74468c0.png",
    href: "/directory?category=Accessories",
    customCta: "The extras that make it extra.",
  },
];

// Initial categories
const initialCategories: CategoryWithBrands[] = categoryDefinitions.map(
  (category) => ({
    ...category,
    brands: [],
  })
);

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
    catalogueImage: "/lovable-uploads/827fb8c0-e5da-4520-a979-6fc054eefc6e.png",
    tailoredImage: "/lovable-uploads/bb152c0b-6378-419b-a0e6-eafce44631b2.png",
  });

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

        // Fetch hero slides, spotlight content, dynamic fallback items, and category images in parallel
        const [
          brandsData,
          heroData,
          spotlightData,
          dynamicItems,
          categoryImgs,
        ] = await Promise.all([
          getAllBrands(),
          getActiveHeroSlides(),
          getActiveSpotlightContent(),
          generateDynamicFallbackItems(),
          generateDynamicCategoryImages(),
        ]);

        // Set dynamic fallback items and category images
        setDynamicFallbackItems(dynamicItems);
        setCategoryImages(categoryImgs);

        // Process brands data
        const updatedCategories = initialCategories.map((category) => ({
          ...category,
          brands: brandsData
            .filter((brand) => brand.category === category.title)
            .slice(0, 8)
            .map((brand) => ({
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
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load content. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-canela text-center mb-12">
            Browse by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Catalogues Card */}
            <div className="relative group overflow-hidden rounded-lg">
              <Link href="/catalogues">
                <div className="relative aspect-[3/2]">
                  <Image
                    src={categoryImages.catalogueImage}
                    alt="Catalogues"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className={`${getCategoryImageFocalPoint("catalogues")} transition-transform duration-300 group-hover:scale-105`}
                  />
                  <div className="absolute inset-0 bg-black/30 transition-opacity group-hover:bg-black/40" />
                  <div className="absolute bottom-6 left-6 text-white">
                    <h3 className="text-2xl font-canela mb-2">Catalogues</h3>
                    <p className="text-sm">
                      Shop for an occasion, holiday, or ready to wear piece
                    </p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Tailored Card */}
            <div className="relative group overflow-hidden rounded-lg">
              <Link href="/tailors">
                <div className="relative aspect-[3/2]">
                  <Image
                    src={categoryImages.tailoredImage}
                    alt="Tailored"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className={`${getCategoryImageFocalPoint("tailored")} transition-transform duration-300 group-hover:scale-105`}
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
        <section className="py-20 bg-oma-beige relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-oma-plum/10 via-transparent to-transparent opacity-50"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <FadeIn>
              <SectionHeader
                title={spotlightContent.title}
                subtitle={spotlightContent.subtitle}
                titleClassName="text-2xl md:text-3xl font-canela"
                subtitleClassName="text-base text-oma-cocoa/80"
              />
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mt-10">
              <SlideUp delay={0.2}>
                <div className="rounded-2xl overflow-hidden relative group">
                  <Image
                    src={spotlightContent.main_image}
                    alt={`${spotlightContent.brand_name} collection`}
                    width={800}
                    height={1000}
                    className="w-full h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-oma-black/70 via-oma-black/30 to-transparent"></div>
                  <div className="absolute bottom-8 left-8 right-8 text-white">
                    <p className="font-canela italic text-xl md:text-2xl">
                      &ldquo;{spotlightContent.brand_quote}&rdquo;
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
                <div className="mt-16">
                  <FadeIn delay={0.2}>
                    <h4 className="font-canela text-xl mb-6 text-oma-cocoa/80">
                      Featured Pieces from {spotlightContent.brand_name}
                    </h4>
                  </FadeIn>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {spotlightContent.featured_products.map((product, i) => (
                      <Link
                        key={i}
                        href={spotlightContent.brand_link}
                        className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 group"
                      >
                        <Image
                          src={product.image}
                          alt={`${spotlightContent.brand_name} ${product.name}`}
                          width={400}
                          height={300}
                          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
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
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-oma-beige/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-canela text-center mb-12">
            What are you dressing for?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Wedding",
                image:
                  "/lovable-uploads/57cc6a40-0f0d-4a7d-8786-41f15832ebfb.png",
                href: "/directory?occasion=Wedding",
              },
              {
                title: "Party",
                image:
                  "/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png",
                href: "/directory?occasion=Party",
              },
              {
                title: "Work",
                image:
                  "/lovable-uploads/99ca757a-bed8-422e-b155-0b9d365b58e0.png",
                href: "/directory?occasion=Work",
              },
              {
                title: "Vacation",
                image:
                  "/lovable-uploads/25c3fe26-3fc4-43ef-83ac-6931a74468c0.png",
                href: "/directory?occasion=Vacation",
              },
            ].map((occasion, index) => (
              <Link key={index} href={occasion.href} className="group">
                <div className="relative aspect-[4/5] rounded-lg overflow-hidden">
                  <Image
                    src={occasion.image}
                    alt={occasion.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 280px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
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

      {/* Brand Categories */}
      {categories.length > 0 ? (
        categories
          .filter((category) => {
            // Special handling for Accessories - show if there are any brands
            if (category.title === "Accessories") {
              return category.brands.length > 0;
            }
            // For other categories, require at least 2 brands (reduced from 4)
            return category.brands.length >= 2;
          })
          .map((category, index) => (
            <section
              key={category.title}
              className={`py-16 px-6 ${
                index % 2 === 0 ? "bg-oma-cream" : "bg-oma-beige/30"
              }`}
            >
              <div className="max-w-7xl mx-auto">
                <FadeIn delay={0.1}>
                  <SectionHeader
                    title={category.title}
                    subtitle={category.customCta}
                    titleClassName="text-2xl md:text-3xl font-canela"
                    subtitleClassName="text-base text-oma-cocoa/80"
                  />
                </FadeIn>

                <div className="mt-10 overflow-hidden">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
                    </div>
                  ) : category.brands.length > 0 ? (
                    <div className="relative">
                      <div className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide">
                        {category.brands.map((brand) => (
                          <Link
                            key={brand.id}
                            href={`/brand/${brand.id}`}
                            className="flex-none w-[280px] group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="aspect-[4/5] relative">
                              <Image
                                src={brand.image}
                                alt={brand.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 280px"
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-lg">
                                  {brand.name}
                                </h3>
                                {brand.isVerified && (
                                  <CheckCircle className="h-5 w-5 text-oma-plum" />
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-oma-cocoa">
                                <span className="px-2 py-1 bg-oma-beige/50 rounded">
                                  {category.title}
                                </span>
                                <span>•</span>
                                <span>{brand.location}</span>
                                <span>•</span>
                                <span>★ {brand.rating}</span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <SlideUp delay={0.3}>
                  <div className="mt-8 text-center">
                    <Button
                      asChild
                      variant="outline"
                      className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
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
              </div>
            </section>
          ))
      ) : (
        <section className="py-16 px-6 bg-oma-cream">
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-sm">
                <p className="text-oma-cocoa text-lg">
                  Loading brand categories...
                </p>
              </div>
            </FadeIn>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeIn delay={0.1}>
            <div className="bg-gradient-to-r from-oma-plum/10 to-oma-gold/10 rounded-xl p-8 md:p-12 text-center">
              <h2 className="font-canela text-3xl md:text-4xl mb-4">
                Ready to Create Something Beautiful?
              </h2>
              <p className="text-lg max-w-2xl mx-auto mb-8">
                Join our community of fashion enthusiasts and talented designers
                bringing creativity to the world.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
                  <Link href="/directory">Find Your Designer</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
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
