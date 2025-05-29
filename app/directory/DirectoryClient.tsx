"use client";

import React, { useState, useEffect } from "react";
import {
  FadeIn,
  SlideUp,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/animations";
import { getAllBrands } from "@/lib/services/brandService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BrandCard } from "@/components/ui/brand-card";
import { cn } from "@/lib/utils";
import { Search, Filter, LayoutGrid, LayoutList } from "@/components/ui/icons";

// Interface for brand display
interface BrandDisplay {
  id: string;
  name: string;
  image: string;
  category: string;
  location: string;
  isVerified: boolean;
}

// Define category and location options
const categories = [
  "All Categories",
  "Bridal",
  "Ready to Wear",
  "Tailoring",
  "Accessories",
];

const locations = [
  "All Locations",
  "Lagos",
  "Accra",
  "Nairobi",
  "Johannesburg",
  "Addis Ababa",
  "Other",
];

export default function DirectoryClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [showFilters, setShowFilters] = useState(false);
  const [displayedBrands, setDisplayedBrands] = useState<BrandDisplay[]>([]);
  const [allBrands, setAllBrands] = useState<BrandDisplay[]>([]);
  const [isGridView, setIsGridView] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch brands from the database
  useEffect(() => {
    if (typeof window === "undefined") return;

    async function fetchBrands() {
      try {
        console.log("🔄 DirectoryClient: Starting brand fetch...");
        setLoading(true);
        setError(null);

        const brandsData = await getAllBrands();
        console.log(
          "📋 DirectoryClient: Fetch complete, brands count:",
          brandsData.length
        );

        // Always ensure we have some data to display, even if it's just sample data
        if (!brandsData || brandsData.length === 0) {
          console.warn(
            "⚠️ DirectoryClient: No brands returned from getAllBrands"
          );
          setError("No brands found, showing sample data");
          setLoading(false);
          return;
        }

        // Convert to display format with fallbacks for all required fields
        const brandDisplayData = brandsData.map((brand) => ({
          id:
            brand.id || `temp-id-${Math.random().toString(36).substring(2, 9)}`,
          name: brand.name || "Unnamed Brand",
          image: brand.image || "/placeholder.jpg",
          category: brand.category || "Uncategorized",
          location: brand.location ? brand.location.split(",")[0] : "Unknown", // Take just the city name
          isVerified: brand.is_verified || false,
        }));

        console.log(
          "✅ DirectoryClient: Processed brand data:",
          brandDisplayData.length
        );

        setAllBrands(brandDisplayData);
        setDisplayedBrands(brandDisplayData);
      } catch (error) {
        console.error("❌ DirectoryClient: Error fetching brands:", error);
        setError(`Failed to load brands: ${error}`);

        // Create some fallback data to ensure UI isn't empty
        const fallbackBrands = [
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
            category: "Tailoring",
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

        setAllBrands(fallbackBrands);
        setDisplayedBrands(fallbackBrands);
      } finally {
        setLoading(false);
      }
    }

    fetchBrands();
  }, []);

  // Filter brands based on search, category, and location
  useEffect(() => {
    if (typeof window === "undefined") return;

    console.log("DirectoryClient: Filtering brands with:", {
      searchTerm,
      selectedCategory,
      selectedLocation,
      allBrandsCount: allBrands.length,
    });

    let filtered = [...allBrands];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((brand) =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter(
        (brand) => brand.category === selectedCategory
      );
    }

    // Apply location filter
    if (selectedLocation !== "All Locations") {
      filtered = filtered.filter(
        (brand) => brand.location === selectedLocation
      );
    }

    console.log("DirectoryClient: Filtered brands count:", filtered.length);
    setDisplayedBrands(filtered);
  }, [searchTerm, selectedCategory, selectedLocation, allBrands]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All Categories");
    setSelectedLocation("All Locations");
    setDisplayedBrands(allBrands);
  };

  return (
    <>
      <div className="mt-8">
        <FadeIn>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-oma-cocoa" />
              <Input
                type="search"
                placeholder="Search designers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-oma-cocoa/20 focus:border-oma-plum/50"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsGridView(true)}
                className={cn(
                  "w-10 h-10",
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
                  "w-10 h-10",
                  !isGridView ? "bg-oma-beige text-oma-plum" : "text-oma-cocoa"
                )}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="md:w-auto w-full"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                className="md:w-auto w-full border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
                onClick={resetFilters}
              >
                Show All Designers
              </Button>
            </div>
          </div>
        </FadeIn>

        {showFilters && (
          <FadeIn>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-6 rounded-lg bg-oma-beige/50 border border-oma-gold/10">
              <div>
                <Label className="text-oma-cocoa">Category</Label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md border-oma-gold/20 focus:border-oma-plum"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-oma-cocoa">Location</Label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md border-oma-gold/20 focus:border-oma-plum"
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

      <Separator className="my-8 bg-oma-gold/10" />

      {/* Results Section */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              <p>{error}</p>
            </div>
          )}

          <div
            className={cn(
              "grid gap-6",
              isGridView
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "grid-cols-1"
            )}
          >
            {displayedBrands.map((brand) => (
              <BrandCard key={brand.id} {...brand} isPortrait={!isGridView} />
            ))}
          </div>

          {displayedBrands.length === 0 && !error && (
            <FadeIn>
              <div className="text-center py-12 bg-oma-beige/30 rounded-lg p-8">
                <p className="text-oma-cocoa text-lg">
                  No designers found matching your criteria.
                </p>
                <Button
                  onClick={resetFilters}
                  className="mt-4 bg-oma-plum hover:bg-oma-plum/90"
                >
                  Reset Filters
                </Button>
              </div>
            </FadeIn>
          )}
        </>
      )}
    </>
  );
}
