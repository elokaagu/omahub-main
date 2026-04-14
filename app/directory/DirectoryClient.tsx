"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FadeIn } from "@/app/components/ui/animations";
import { useAllBrands } from "@/lib/hooks/useBrands";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BrandCard } from "@/components/ui/brand-card";
import { cn } from "@/lib/utils";
import { Search, Filter, LayoutGrid, LayoutList } from "@/components/ui/icons";
import { mapOccasionToCategory, locations } from "@/lib/data/directory";
import { getAllCategoryNames } from "@/lib/data/unified-categories";
import { getAverageRatingsByBrandIds } from "@/lib/services/brandService";
import {
  DIRECTORY_DEV_FALLBACK_BRANDS,
  mapBrandsToDisplay,
} from "./directoryBrandMap";
import { filterDirectoryBrands } from "./directoryFilters";

export default function DirectoryClient() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [showFilters, setShowFilters] = useState(false);
  const [isGridView, setIsGridView] = useState(true);
  const [brandRatings, setBrandRatings] = useState<Record<string, number>>({});

  const { brands: allBrands, loading, error } = useAllBrands(false);

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    const subcategoryParam = searchParams.get("subcategory");
    const occasionParam = searchParams.get("occasion");

    if (occasionParam) {
      setSelectedCategory(mapOccasionToCategory(occasionParam));
    } else if (categoryParam) {
      if (subcategoryParam) {
        setSelectedCategory(subcategoryParam.replace(/\+/g, " "));
      } else {
        setSelectedCategory(categoryParam);
      }
    }
  }, [searchParams]);

  const mappedFromApi = useMemo(
    () => mapBrandsToDisplay(allBrands ?? []),
    [allBrands]
  );

  const isDev = process.env.NODE_ENV === "development";

  const directoryBrands = useMemo(() => {
    if (mappedFromApi.length > 0) return mappedFromApi;
    if (isDev && !loading && !error) return DIRECTORY_DEV_FALLBACK_BRANDS;
    return [];
  }, [mappedFromApi, loading, error, isDev]);

  const filteredBrands = useMemo(
    () =>
      filterDirectoryBrands(
        directoryBrands,
        searchTerm,
        selectedCategory,
        selectedLocation
      ),
    [directoryBrands, searchTerm, selectedCategory, selectedLocation]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadRatings() {
      const ids = mappedFromApi.map((b) => b.id);
      if (ids.length === 0) {
        setBrandRatings({});
        return;
      }
      try {
        const averages = await getAverageRatingsByBrandIds(ids);
        if (!cancelled) setBrandRatings(averages);
      } catch {
        if (!cancelled) setBrandRatings({});
      }
    }

    loadRatings();
    return () => {
      cancelled = true;
    };
  }, [mappedFromApi]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All Categories");
    setSelectedLocation("All Locations");
  };

  const errorMessage =
    error instanceof Error ? error.message : error ? String(error) : null;

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6 mx-4 sm:mx-6 md:mx-8 lg:mx-12">
      <div className="mb-3 sm:mb-4">
        <p className="text-sm sm:text-base text-gray-600">
          Discover and connect with our curated selection of brands
        </p>
      </div>

      {errorMessage && !loading ? (
        <div
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-center sm:text-left"
          role="alert"
        >
          <p className="text-red-700 text-sm sm:text-base">{errorMessage}</p>
          <p className="mt-2 text-gray-600 text-xs sm:text-sm">
            You can retry loading designers below.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3 border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
            onClick={() =>
              typeof window !== "undefined" && window.location.reload()
            }
          >
            Refresh page
          </Button>
        </div>
      ) : null}

      <div className="mb-3 sm:mb-4">
        <FadeIn>
          <div className="flex flex-col gap-2">
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

            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
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

        {showFilters ? (
          <FadeIn>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 sm:p-4 rounded-lg bg-oma-beige/50 border border-oma-gold/10">
              <div className="min-w-0">
                <Label className="text-oma-cocoa text-sm sm:text-base">
                  Category
                </Label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full mt-1 p-2 sm:p-3 border rounded-md border-oma-gold/20 focus:border-oma-plum min-h-[44px] text-sm sm:text-base bg-white"
                >
                  <option value="All Categories">All Categories</option>
                  {getAllCategoryNames().map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0">
                <Label className="text-oma-cocoa text-sm sm:text-base">
                  Location
                </Label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full mt-1 p-2 sm:p-3 border rounded-md border-oma-gold/20 focus:border-oma-plum min-h-[44px] text-sm sm:text-base bg-white"
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
        ) : null}
      </div>

      <Separator className="my-4 sm:my-6 bg-oma-gold/10" />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <div className="mb-2">
            <p className="text-xs sm:text-sm text-gray-600">
              Showing {filteredBrands.length} brand
              {filteredBrands.length === 1 ? "" : "s"}
            </p>
          </div>

          <div
            className={cn(
              "grid gap-3 sm:gap-4",
              isGridView
                ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "grid-cols-1"
            )}
          >
            {filteredBrands.map((brand) => (
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

          {filteredBrands.length === 0 &&
          !error &&
          directoryBrands.length > 0 ? (
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
          ) : null}

          {filteredBrands.length === 0 && !error && directoryBrands.length === 0 ? (
            <FadeIn>
              <div className="text-center py-8 sm:py-12 bg-oma-beige/30 rounded-lg p-6 sm:p-8">
                <p className="text-oma-cocoa text-base sm:text-lg">
                  No designers are listed yet. Check back soon.
                </p>
              </div>
            </FadeIn>
          ) : null}

          {filteredBrands.length === 0 && error ? (
            <FadeIn>
              <div className="text-center py-8 sm:py-12 bg-oma-beige/30 rounded-lg p-6 sm:p-8">
                <p className="text-oma-cocoa text-base sm:text-lg">
                  Designers could not be loaded. Try refreshing the page.
                </p>
              </div>
            </FadeIn>
          ) : null}
        </>
      )}
    </div>
  );
}
