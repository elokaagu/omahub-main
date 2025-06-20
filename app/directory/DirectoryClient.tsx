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
  subcategories,
  type Subcategory,
  getAllFilterCategories,
  mapOccasionToCategory,
  mapDatabaseToDisplayCategory,
  locations,
} from "@/lib/data/directory";

// Interface for brand display
interface BrandDisplay {
  id: string;
  name: string;
  image: string;
  category: Subcategory;
  location: string;
  isVerified: boolean;
}

// Define category and location options using helper functions
const categories = getAllFilterCategories();

// Map database categories to expected subcategories using the standardized mapping
const mapDatabaseCategoryToSubcategory = (dbCategory: string): Subcategory => {
  const mappedCategory = mapDatabaseToDisplayCategory(dbCategory);
  // Ensure the mapped category is a valid subcategory, default to "Ready to Wear"
  const allSubcategories = Object.values(subcategories).flat();
  return allSubcategories.includes(mappedCategory as Subcategory)
    ? (mappedCategory as Subcategory)
    : "Ready to Wear";
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

  // Convert brands to display format when allBrands changes
  useEffect(() => {
    if (!allBrands || allBrands.length === 0) {
      console.log(
        "⚠️ DirectoryClient: No brands data available, using fallback data"
      );
      setDisplayedBrands(fallbackBrands);
      return;
    }

    console.log("🔄 DirectoryClient: Converting brands to display format...");
    console.log("🔍 DirectoryClient: Raw brands data:", allBrands);

    // Convert to display format with fallbacks for all required fields
    const brandDisplayData: BrandDisplay[] = allBrands.map((brand) => ({
      id: brand.id || `temp-id-${Math.random().toString(36).substring(2, 9)}`,
      name: brand.name || "Unnamed Brand",
      image: brand.image || "/placeholder.jpg",
      category: mapDatabaseCategoryToSubcategory(
        brand.category || "Ready to Wear"
      ), // Map category
      location: brand.location ? brand.location.split(",")[0] : "Unknown", // Take just the city name
      isVerified: brand.is_verified || false,
    }));

    console.log(
      "✅ DirectoryClient: Processed",
      brandDisplayData.length,
      "brands"
    );
    console.log("🔍 DirectoryClient: Processed brands:", brandDisplayData);
    setDisplayedBrands(brandDisplayData);
  }, [allBrands]);

  // Filter brands based on search, category, and location
  useEffect(() => {
    console.log("DirectoryClient: Filtering brands with:", {
      searchTerm,
      selectedCategory,
      selectedLocation,
      allBrandsCount: allBrands?.length || 0,
    });

    if (!allBrands || allBrands.length === 0) {
      console.log(
        "⚠️ DirectoryClient: No brands to filter, using fallback data"
      );
      setDisplayedBrands(fallbackBrands);
      return;
    }

    let filtered = [...allBrands].map((brand) => ({
      id: brand.id || `temp-id-${Math.random().toString(36).substring(2, 9)}`,
      name: brand.name || "Unnamed Brand",
      image: brand.image || "/placeholder.jpg",
      category: mapDatabaseCategoryToSubcategory(
        brand.category || "Ready to Wear"
      ), // Map category
      location: brand.location ? brand.location.split(",")[0] : "Unknown",
      isVerified: brand.is_verified || false,
    }));

    console.log("🔍 DirectoryClient: Starting with", filtered.length, "brands");

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((brand) =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log(
        "🔍 DirectoryClient: After search filter:",
        filtered.length,
        "brands"
      );
    }

    // Apply category filter
    if (selectedCategory !== "All Categories") {
      if (
        collections.includes(selectedCategory as (typeof collections)[number])
      ) {
        // If it's a main category, show all brands in its subcategories
        const subcats =
          subcategories[selectedCategory as (typeof collections)[number]];
        filtered = filtered.filter((brand) =>
          subcats.some((subcat) => subcat === brand.category)
        );
      } else {
        // If it's a subcategory, show only brands in that specific category
        filtered = filtered.filter(
          (brand) => brand.category === selectedCategory
        );
      }
      console.log(
        "🔍 DirectoryClient: After category filter:",
        filtered.length,
        "brands"
      );
    }

    // Apply location filter
    if (selectedLocation !== "All Locations") {
      filtered = filtered.filter(
        (brand) => brand.location === selectedLocation
      );
      console.log(
        "🔍 DirectoryClient: After location filter:",
        filtered.length,
        "brands"
      );
    }

    console.log("✅ DirectoryClient: Final filtered brands:", filtered.length);
    setDisplayedBrands(filtered);
  }, [searchTerm, selectedCategory, selectedLocation, allBrands]);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All Categories");
    setSelectedLocation("All Locations");
    if (allBrands) {
      const brandDisplayData: BrandDisplay[] = allBrands.map((brand) => ({
        id: brand.id || `temp-id-${Math.random().toString(36).substring(2, 9)}`,
        name: brand.name || "Unnamed Brand",
        image: brand.image || "/placeholder.jpg",
        category: mapDatabaseCategoryToSubcategory(
          brand.category || "Ready to Wear"
        ), // Map category
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
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Header section - removed "Brand Directory" text */}
      <div className="mb-6 sm:mb-8">
        <p className="text-sm sm:text-base text-gray-600">
          Discover and connect with our curated selection of brands
        </p>
      </div>

      {/* Search and filters section */}
      <div className="mb-6 sm:mb-8">
        <FadeIn>
          <div className="flex flex-col gap-4">
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
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
              {/* View toggle buttons */}
              <div className="flex gap-2 order-2 sm:order-1">
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
              <div className="flex gap-2 flex-1 order-1 sm:order-2">
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
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-6 rounded-lg bg-oma-beige/50 border border-oma-gold/10">
              <div>
                <Label className="text-oma-cocoa text-sm sm:text-base">
                  Category
                </Label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full mt-1 p-2 sm:p-3 border rounded-md border-oma-gold/20 focus:border-oma-plum min-h-[44px] text-sm sm:text-base"
                >
                  {categories.map((category) => (
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
                  className="w-full mt-1 p-2 sm:p-3 border rounded-md border-oma-gold/20 focus:border-oma-plum min-h-[44px] text-sm sm:text-base"
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

      <Separator className="my-6 sm:my-8 bg-oma-gold/10" />

      {/* Error display */}
      {error && <ErrorDisplay />}

      {/* Loading state */}
      {loading ? (
        <LoadingDisplay />
      ) : (
        <>
          {/* Results count */}
          <div className="mb-4">
            <p className="text-sm sm:text-base text-gray-600">
              Showing {displayedBrands.length} brand
              {displayedBrands.length === 1 ? "" : "s"}
            </p>
          </div>

          {/* Brand grid/list */}
          <div
            className={cn(
              "grid gap-4 sm:gap-6",
              isGridView
                ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "grid-cols-1"
            )}
          >
            {displayedBrands.map((brand) => (
              <BrandCard key={brand.id} {...brand} isPortrait={!isGridView} />
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
