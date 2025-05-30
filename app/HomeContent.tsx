"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import {
  FadeIn,
  SlideUp,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/animations";
import { getAllBrands } from "@/lib/services/brandService";
import { Carousel } from "@/components/ui/carousel-custom";
import { SectionHeader } from "@/components/ui/section-header";
import { CategoryCard } from "@/components/ui/category-card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "@/components/ui/icons";

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

const carouselItems = [
  {
    id: 1,
    image: "/lovable-uploads/827fb8c0-e5da-4520-a979-6fc054eefc6e.png",
    title: "Editorial",
    subtitle: "Where African luxury finds its voice",
    link: "/directory?category=Ready%20to%20Wear",
    heroTitle: "New\nSeason",
    isEditorial: true,
  },
  {
    id: 2,
    image: "/lovable-uploads/bb152c0b-6378-419b-a0e6-eafce44631b2.png",
    title: "Modern Romance",
    subtitle: "Redefining bridal wear with cultural elegance",
    link: "/directory?category=Bridal",
    heroTitle: "Modern\nRomance",
    isEditorial: true,
  },
  {
    id: 3,
    image: "/lovable-uploads/de2841a8-58d1-4fd4-adfa-8c9aa09e9bb2.png",
    title: "Lagos Rising",
    subtitle: "The future of African fashion is here",
    link: "/directory?category=Ready%20to%20Wear",
    heroTitle: "Lagos\nRising",
    isEditorial: true,
  },
];

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
  // Client-side state initialization
  const [categories, setCategories] =
    useState<CategoryWithBrands[]>(initialCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Prevent running on the server
    if (typeof window === "undefined") return;

    // Add a timeout to prevent infinite loading state on error
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log("Loading timeout reached, forcing UI update");
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    async function fetchBrands() {
      try {
        console.time("fetchBrandsForHome");
        setLoading(true);
        const allBrands = await getAllBrands();
        console.timeEnd("fetchBrandsForHome");

        if (!allBrands || allBrands.length === 0) {
          console.warn("No brands found in database, using fallback data");
          applyFallbackData();
          setLoading(false);
          return;
        }

        console.log(
          `🔍 Processing ${allBrands.length} brands for home display`
        );
        console.log("🔍 Sample brand:", allBrands[0]);

        // Process categories in parallel - more efficient
        const updatedCategories = categoryDefinitions.map((category) => {
          // Filter brands by category
          const categoryBrands = allBrands
            .filter((brand) => brand.category === category.title)
            .slice(0, 8) // Get up to 8 brands per category
            .map((brand) => ({
              id:
                brand.id ||
                `temp-id-${Math.random().toString(36).substring(2, 9)}`,
              name: brand.name || "Brand Name",
              image: brand.image || "/placeholder-image.jpg",
              location: brand.location
                ? brand.location.split(",")[0]
                : "Unknown", // Take just the city name
              rating: brand.rating || 4.5,
              isVerified: brand.is_verified || false,
              category: brand.category || "Other",
            }));

          console.log(
            `🔍 Category "${category.title}" has ${categoryBrands.length} brands`
          );

          return {
            ...category,
            brands:
              categoryBrands.length > 0
                ? categoryBrands
                : getFallbackBrandsForCategory(category.title),
          };
        });

        // Use all categories, even if they don't have brands (we'll use fallbacks)
        setCategories(updatedCategories);
      } catch (error) {
        console.error("Error fetching brands for home page:", error);
        applyFallbackData();
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    }

    // Function to provide fallback data by category
    function getFallbackBrandsForCategory(category: string): BrandDisplay[] {
      // Return 1-2 sample brands per category
      switch (category) {
        case "Bridal":
          return [
            {
              id: "bridal-fallback-1",
              name: "Imad Eduso",
              image:
                "/lovable-uploads/57cc6a40-0f0d-4a7d-8786-41f15832ebfb.png",
              location: "Lagos",
              rating: 5.0,
              isVerified: true,
              category: "Bridal",
            },
            {
              id: "bridal-fallback-2",
              name: "Weiz Dhurm Franklyn",
              image:
                "/lovable-uploads/57cc6a40-0f0d-4a7d-8786-41f15832ebfb.png",
              location: "Lagos",
              rating: 4.9,
              isVerified: true,
              category: "Bridal",
            },
          ];
        case "Ready to Wear":
          return [
            {
              id: "rtw-fallback-1",
              name: "Adiree",
              image:
                "/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png",
              location: "Lagos",
              rating: 4.8,
              isVerified: true,
              category: "Ready to Wear",
            },
            {
              id: "rtw-fallback-2",
              name: "Orange Culture",
              image:
                "/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png",
              location: "Lagos",
              rating: 4.7,
              isVerified: true,
              category: "Ready to Wear",
            },
          ];
        case "Tailoring":
          return [
            {
              id: "tailoring-fallback-1",
              name: "Emmy Kasbit",
              image:
                "/lovable-uploads/99ca757a-bed8-422e-b155-0b9d365b58e0.png",
              location: "Accra",
              rating: 4.6,
              isVerified: true,
              category: "Tailoring",
            },
          ];
        case "Accessories":
          return [
            {
              id: "accessories-fallback-1",
              name: "Shekudo",
              image:
                "/lovable-uploads/25c3fe26-3fc4-43ef-83ac-6931a74468c0.png",
              location: "Nairobi",
              rating: 4.7,
              isVerified: true,
              category: "Accessories",
            },
          ];
        default:
          return [];
      }
    }

    // Apply fallback data to all categories
    function applyFallbackData() {
      const fallbackCategories = categoryDefinitions.map((category) => ({
        ...category,
        brands: getFallbackBrandsForCategory(category.title),
      }));

      setCategories(fallbackCategories);
    }

    fetchBrands();

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <>
      {/* Hero Section with Enhanced Carousel */}
      <section className="w-full animate-fadeInUp">
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

      {/* What Are You Dressing For Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto" id="categories">
        <FadeIn>
          <SectionHeader
            title="What Are You Dressing For?"
            subtitle="Explore designers by occasion - from aisle ready to Lagos bound."
            titleClassName="text-2xl md:text-3xl font-canela"
            subtitleClassName="text-base text-oma-cocoa/80"
          />
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-14">
          {categoryDefinitions.map((category) => (
            <CategoryCard
              key={category.title}
              title={category.title}
              image={category.image}
              href={category.href}
              customCta={category.customCta}
              className="hover-scale shadow-lg"
            />
          ))}
        </div>
      </section>

      {/* Spotlight Section */}
      <section className="py-20 bg-oma-beige relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-oma-plum/10 via-transparent to-transparent opacity-50"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <FadeIn>
            <SectionHeader
              title="Spotlight On: Mbali Studio"
              subtitle="Where tradition meets modern edge each piece tells a story you'll want to wear."
              titleClassName="text-2xl md:text-3xl font-canela"
              subtitleClassName="text-base text-oma-cocoa/80"
            />
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mt-10">
            <SlideUp delay={0.2}>
              <div className="rounded-2xl overflow-hidden relative group">
                <Image
                  src="/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png"
                  alt="Mbali Studio collection"
                  width={800}
                  height={1000}
                  className="w-full h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-oma-black/70 via-oma-black/30 to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <p className="font-canela italic text-xl md:text-2xl">
                    &ldquo;This month, meet the Johannesburg studio weaving
                    culture into silk.&rdquo;
                  </p>
                </div>
              </div>
            </SlideUp>

            <SlideUp delay={0.4}>
              <div className="flex flex-col h-full justify-center">
                <h3 className="font-canela text-3xl md:text-4xl mb-6 text-oma-plum italic">
                  Mbali Studio
                </h3>
                <p className="text-oma-cocoa mb-6 text-lg">
                  Founded in 2018 by textile artist Thandi Mbali, this
                  Johannesburg based studio has quickly become known for its
                  luxurious silk pieces featuring contemporary interpretations
                  of traditional African patterns.
                </p>
                <p className="text-oma-cocoa mb-8 text-lg">
                  Each piece tells a story of cultural heritage while embracing
                  modern silhouettes and sustainable production methods, making
                  it a favorite among conscious fashion enthusiasts across the
                  continent.
                </p>

                <div className="mt-4 flex flex-col gap-6">
                  <div className="p-5 border-l-2 border-oma-gold bg-white/70 rounded-r-lg">
                    <p className="italic text-oma-cocoa/80 text-lg">
                      &ldquo;Where elegance comes stitched with meaning.&rdquo;
                    </p>
                    <p className="text-sm text-oma-cocoa/60 mt-2">
                      — Thandi Mbali, Founder
                    </p>
                  </div>

                  <Button
                    asChild
                    className="bg-oma-plum hover:bg-oma-plum/90 w-fit mt-4"
                  >
                    <Link href="/brand/mbali-studio">See the Collection</Link>
                  </Button>
                </div>
              </div>
            </SlideUp>
          </div>

          {/* Featured Products */}
          <div className="mt-16">
            <FadeIn delay={0.2}>
              <h4 className="font-canela text-xl mb-6 text-oma-cocoa/80">
                Featured Pieces from Mbali Studio
              </h4>
            </FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Link
                  key={i}
                  href="/brand/mbali-studio"
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 group"
                >
                  <Image
                    src={`/lovable-uploads/${
                      [
                        "53ab4ec9-fd54-4aa8-a292-70669af33185.png",
                        "eca14925-7de8-4100-af5d-b158ff70e951.png",
                        "023ba098-0109-4738-9baf-1321bc3d2fe1.png",
                        "840e541a-b4c1-4e59-94af-89c8345e4d2d.png",
                      ][i - 1]
                    }`}
                    alt={`Mbali Studio ${
                      ["Scarf", "Dress", "Top", "Pants"][i - 1]
                    }`}
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="p-4">
                    <h5 className="font-medium text-oma-black group-hover:text-oma-plum transition-colors">
                      Silk {["Scarf", "Dress", "Top", "Pants"][i - 1]}
                    </h5>
                    <p className="text-sm text-oma-cocoa/70">
                      {
                        [
                          "Heritage Collection",
                          "Summer '24 Collection",
                          "Essential Series",
                          "Limited Edition",
                        ][i - 1]
                      }
                    </p>
                    <span className="text-sm text-oma-plum mt-2 inline-block">
                      View Collection →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Brand Categories */}
      {categories.length > 0 ? (
        categories
          .filter((category) => category.brands.length >= 4) // Only show categories with 4 or more brands
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
                  {loading ? (
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
                bringing African creativity to the world.
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
    </>
  );
}
