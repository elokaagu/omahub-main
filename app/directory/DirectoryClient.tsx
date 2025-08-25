"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  FadeIn,
  SlideUp,
  StaggerContainer,
  StaggerItem,
} from "@/app/components/ui/animations";
import { useAllBrands } from "@/lib/hooks/useBrands";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BrandCard } from "@/components/ui/brand-card";
import { cn } from "@/lib/utils";
import { Search, Filter, LayoutGrid, LayoutList } from "@/components/ui/icons";
import {
  collections,
  mapOccasionToCategory,
  mapDatabaseToDisplayCategory,
  locations,
  categoryMapping,
} from "@/lib/data/directory";
import {
  mapLegacyToUnified,
  getAllCategoryNames,
} from "@/lib/data/unified-categories";
import { getCategoriesForDirectory } from "@/lib/data/unified-categories";
import { UnifiedTag, CategoryTag } from "@/components/ui/unified-tag";
import { getBrandReviews } from "@/lib/services/brandService";

// Interface for brand display
interface BrandDisplay {
  id: string;
  name: string;
  image: string;
  category: string; // legacy single category
  categories?: string[]; // new multiple categories
  location: string;
  isVerified: boolean;
}

// Define category and location options using helper functions
const getBrandCategories = (brands: BrandDisplay[]) => {
  const uniqueCategories = Array.from(new Set(brands.map((b) => b.category)));
  return uniqueCategories.filter(Boolean).sort((a, b) => a.localeCompare(b));
};

// Fallback brands with correct category types
const fallbackBrands: BrandDisplay[] = [
  {
    id: "fallback-1",
    name: "Adiree",
    image: "/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png",
    category: "Ready to Wear",
    location: "Lagos",
    isVerified: true,
  },
  {
    id: "fallback-2",
    name: "Imad Eduso",
    image: "/lovable-uploads/57cc6a40-0f0d-4a7d-8786-41f15832ebfb.png",
    category: "Bridal",
    location: "Lagos",
    isVerified: true,
  },
  {
    id: "fallback-3",
    name: "Emmy Kasbit",
    image: "/lovable-uploads/99ca757a-bed8-422e-b155-0b9d365b58e0.png",
    category: "Ready to Wear", // Changed from "Custom Design"
    location: "Accra",
    isVerified: true,
  },
  {
    id: "fallback-4",
    name: "Shekudo",
    image: "/lovable-uploads/25c3fe26-3fc4-43ef-83ac-6931a74468c0.png",
    category: "Accessories",
    location: "Nairobi",
    isVerified: true,
  },
];

function useClientOnly<T>(callback: () => T, deps: any[] = []): T | undefined {
  const [value, setValue] = useState<T>();

  useEffect(() => {
    setValue(callback());
  }, deps);

  return value;
}

export default function DirectoryClient() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [showFilters, setShowFilters] = useState(false);
  const [displayedBrands, setDisplayedBrands] = useState<BrandDisplay[]>([]);
  const [isGridView, setIsGridView] = useState(true);
  // Add a new state for ratings
  const [brandRatings, setBrandRatings] = useState<Record<string, number>>({});

  // Use the useAllBrands hook WITHOUT filtering for brands that have products
  const { brands: allBrands, loading, error } = useAllBrands(false);

  // Debug logging
  useEffect(() => {
    console.log("🔍 DirectoryClient Debug Info:");
    console.log("- Loading:", loading);
    console.log("- Error:", error);
    console.log("- allBrands:", allBrands);
    console.log("- allBrands length:", allBrands?.length || 0);
    console.log("- displayedBrands length:", displayedBrands.length);

    if (allBrands && allBrands.length > 0) {
      console.log("- First brand:", allBrands[0]);
      console.log(
        "- All brand names:",
        allBrands.map((b) => b.name)
      );
    }
  }, [allBrands, loading, error, displayedBrands]);

  // Handle URL parameters on component mount
  useEffect(() => {
    if (!searchParams) return;

    const categoryParam = searchParams.get("category");
    const subcategoryParam = searchParams.get("subcategory");
    const occasionParam = searchParams.get("occasion");

    if (occasionParam) {
      // Handle occasion filtering from "What are you dressing for?" section
      const mappedCategory = mapOccasionToCategory(occasionParam);
      setSelectedCategory(mappedCategory);
    } else if (categoryParam) {
      if (subcategoryParam) {
        // If there's a subcategory, use that for filtering
        const decodedSubcategory = subcategoryParam.replace(/\+/g, " ");
        setSelectedCategory(decodedSubcategory);
      } else {
        // If only category, use the category
        setSelectedCategory(categoryParam);
      }
    }
  }, [searchParams]);

  // Use raw category for display and filtering
  useEffect(() => {
    if (!allBrands || allBrands.length === 0) {
      setDisplayedBrands(fallbackBrands);
      return;
    }
    const brandDisplayData = allBrands.map((brand) => ({
      id: brand.id || `temp-id-${Math.random().toString(36).substring(2, 9)}`,
      name: brand.name || "Unnamed Brand",
      image: brand.image || "/placeholder.jpg",
      category: brand.category || "",
      categories: brand.categories || [],
      location: brand.location ? brand.location.split(",")[0] : "Unknown",
      isVerified: brand.is_verified || false,
    }));
    setDisplayedBrands(brandDisplayData);
  }, [allBrands]);

  // Update filter logic to use new mapping
  useEffect(() => {
    if (!allBrands || allBrands.length === 0) {
      setDisplayedBrands(fallbackBrands);
      return;
    }
    let filtered = [...allBrands].map((brand) => ({
      id: brand.id || `temp-id-${Math.random().toString(36).substring(2, 9)}`,
      name: brand.name || "Unnamed Brand",
      image: brand.image || "/placeholder.jpg",
      category: brand.category || "",
      categories: brand.categories || [],
      location: brand.location ? brand.location.split(",")[0] : "Unknown",
      isVerified: brand.is_verified || false,
    }));
    if (searchTerm) {
      filtered = filtered.filter((brand) =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory !== "All Categories") {
      const selectedUnifiedId = mapLegacyToUnified(selectedCategory);
      filtered = filtered.filter((brand) => {
        const allCategories = [
          brand.category,
          ...(brand.categories || []),
        ].filter(Boolean);
        return allCategories.some(
          (cat) => mapLegacyToUnified(cat) === selectedUnifiedId
        );
      });
    }
    if (selectedLocation !== "All Locations") {
      filtered = filtered.filter(
        (brand) => brand.location === selectedLocation
      );
    }
    setDisplayedBrands(filtered);
  }, [searchTerm, selectedCategory, selectedLocation, allBrands]);

  // Fetch ratings for all brands when allBrands changes
  useEffect(() => {
    async function fetchRatings() {
      if (!allBrands || allBrands.length === 0) return;
      const ratings: Record<string, number> = {};
      await Promise.all(
        allBrands.map(async (brand) => {
          try {
            const reviews = await getBrandReviews(brand.id);
            if (reviews && reviews.length > 0) {
              const avg =
                reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
                reviews.length;
              ratings[brand.id] = avg;
            } else {
              ratings[brand.id] = 0;
            }
          } catch (e) {
            ratings[brand.id] = 0;
          }
        })
      );
      setBrandRatings(ratings);
    }
    fetchRatings();
  }, [allBrands]);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All Categories");
    setSelectedLocation("All Locations");
    if (allBrands) {
      const brandDisplayData = allBrands.map((brand) => ({
        id: brand.id || `temp-id-${Math.random().toString(36).substring(2, 9)}`,
        name: brand.name || "Unnamed Brand",
        image: brand.image || "/placeholder.jpg",
        category: brand.category || "Ready to Wear",
        location: brand.location ? brand.location.split(",")[0] : "Unknown",
        isVerified: brand.is_verified || false,
      }));
      console.log(
        "🔄 DirectoryClient: Reset filters, showing",
        brandDisplayData.length,
        "brands"
      );
      setDisplayedBrands(brandDisplayData);
    }
  };

  // Error display component
  const ErrorDisplay = () => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
      <p className="text-red-600 mb-4">
        {error instanceof Error
          ? error.message
          : "An error occurred while loading brands"}
      </p>
      <p className="text-gray-600 mb-4">
        Showing sample brands while we try to fix the issue.
      </p>
    </div>
  );

  // Loading display component
  const LoadingDisplay = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
    </div>
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-red-500 mb-4">
          {error instanceof Error ? error.message : String(error)}
        </div>
        <button
          onClick={() =>
            typeof window !== "undefined" && window.location.reload()
          }
          className="px-4 py-2 bg-oma-plum text-white rounded hover:bg-oma-plum/90"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6 mx-4 sm:mx-6 md:mx-8 lg:mx-12">
      {/* Header section - removed "Brand Directory" text */}
      <div className="mb-3 sm:mb-4">
        <p className="text-sm sm:text-base text-gray-600">
          Discover and connect with our curated selection of brands
        </p>
      </div>

      {/* Search and filters section */}
      <div className="mb-3 sm:mb-4">
        <FadeIn>
          <div className="flex flex-col gap-2">
            {/* Search bar */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-oma-cocoa" />
              <Input
                type="search"
                placeholder="Search designers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-oma-cocoa/20 focus:border-oma-plum/50 min-h-[44px] text-sm sm:text-base"
              />
            </div>

            {/* Controls row */}
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
              {/* View toggle buttons */}
              <div className="flex gap-1 order-2 sm:order-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsGridView(true)}
                  className={cn(
                    "min-w-[44px] min-h-[44px]",
                    isGridView ? "bg-oma-beige text-oma-plum" : "text-oma-cocoa"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsGridView(false)}
                  className={cn(
                    "min-w-[44px] min-h-[44px]",
                    !isGridView
                      ? "bg-oma-beige text-oma-plum"
                      : "text-oma-cocoa"
                  )}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>

              {/* Filter and reset buttons */}
              <div className="flex gap-1 flex-1 order-1 sm:order-2">
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none min-h-[44px] text-sm sm:text-base"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white min-h-[44px] text-sm sm:text-base"
                  onClick={resetFilters}
                >
                  <span className="hidden sm:inline">Show All Designers</span>
                  <span className="sm:hidden">Show All</span>
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>

        {showFilters && (
          <FadeIn>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 sm:p-4 rounded-lg bg-oma-beige/50 border border-oma-gold/10">
              <div>
                <Label className="text-oma-cocoa text-sm sm:text-base">
                  Category
                </Label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full mt-1 p-2 sm:p-3 border rounded-md border-oma-gold/20 focus:border-oma-plum min-h-[44px] text-sm sm:text-base mx-2 sm:mx-4 md:mx-6 lg:mx-8 max-w-xs"
                >
                  <option value="All Categories">All Categories</option>
                  {getAllCategoryNames().map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-oma-cocoa text-sm sm:text-base">
                  Location
                </Label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full mt-1 p-2 sm:p-3 border rounded-md border-oma-gold/20 focus:border-oma-plum min-h-[44px] text-sm sm:text-base mx-2 sm:mx-4 md:mx-6 lg:mx-8 max-w-xs"
                >
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </FadeIn>
        )}
      </div>

      <Separator className="my-4 sm:my-6 bg-oma-gold/10" />

      {/* Error display */}
      {error && <ErrorDisplay />}

      {/* Loading state */}
      {loading ? (
        <LoadingDisplay />
      ) : (
        <>
          {/* Results count */}
          <div className="mb-2">
            <p className="text-xs sm:text-sm text-gray-600">
              Showing {displayedBrands.length} brand
              {displayedBrands.length === 1 ? "" : "s"}
            </p>
          </div>

          {/* Brand grid/list */}
          <div
            className={cn(
              "grid gap-3 sm:gap-4",
              isGridView
                ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "grid-cols-1"
            )}
          >
            {displayedBrands.map((brand) => (
              <BrandCard
                key={brand.id}
                {...brand}
                category={
                  brand.categories && brand.categories.length > 0
                    ? brand.categories.join(", ")
                    : brand.category
                }
                isPortrait={!isGridView}
                rating={brandRatings[brand.id] ?? 0}
              />
            ))}
          </div>

          {displayedBrands.length === 0 && !error && (
            <FadeIn>
              <div className="text-center py-8 sm:py-12 bg-oma-beige/30 rounded-lg p-6 sm:p-8">
                <p className="text-oma-cocoa text-base sm:text-lg">
                  No designers found matching your criteria.
                </p>
                <Button
                  onClick={resetFilters}
                  className="mt-4 bg-oma-plum hover:bg-oma-plum/90 min-h-[44px] text-sm sm:text-base"
                >
                  Reset Filters
                </Button>
              </div>
            </FadeIn>
          )}
        </>
      )}
    </div>
  );
}
