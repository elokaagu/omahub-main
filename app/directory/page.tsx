"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SectionHeader } from "@/components/ui/section-header";
import { BrandCard } from "@/components/ui/brand-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Search, Filter, LayoutGrid, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data
const allBrands = [
  {
    id: "adire-designs",
    name: "Adire Designs",
    image: "/lovable-uploads/90f81e12-d22e-4e01-b75b-d3bad4db5e45.png",
    category: "Ready to Wear",
    location: "Lagos",
    isVerified: true,
  },
  {
    id: "kente-collective",
    name: "Kente Collective",
    image: "/lovable-uploads/6f7a1022-2d82-4fb9-9365-6455df679707.png",
    category: "Accessories",
    location: "Accra",
    isVerified: true,
  },
  {
    id: "zora-atelier",
    name: "Zora Atelier",
    image: "/lovable-uploads/41fa65eb-36f2-4987-8c7b-a267b4d0e938.png",
    category: "Bridal",
    location: "Nairobi",
    isVerified: true,
  },
  {
    id: "mbali-studio",
    name: "Mbali Studio",
    image: "/lovable-uploads/e0e57209-1802-453b-a78e-7c7090a85e58.png",
    category: "Ready to Wear",
    location: "Johannesburg",
    isVerified: true,
  },
  {
    id: "afrochic",
    name: "AfroChic",
    image: "/lovable-uploads/abb12cfd-a40d-4890-bfd6-76feb4764069.png",
    category: "Ready to Wear",
    location: "Dakar",
    isVerified: false,
  },
  {
    id: "beads-by-nneka",
    name: "Beads by Nneka",
    image: "/lovable-uploads/b3fb585e-93cf-4aa7-9204-0a1b477fcb06.png",
    category: "Accessories",
    location: "Abuja",
    isVerified: true,
  },
  {
    id: "marrakech-textiles",
    name: "Marrakech Textiles",
    image: "/lovable-uploads/ee92bbfa-4f54-4567-b4ef-8aebd0bca695.png",
    category: "Accessories",
    location: "Marrakech",
    isVerified: false,
  },
  {
    id: "cairo-couture",
    name: "Cairo Couture",
    image: "/lovable-uploads/592425d5-0327-465c-990c-c63a73645792.png",
    category: "Tailoring",
    location: "Cairo",
    isVerified: true,
  },
  {
    id: "ananse-weaving",
    name: "Ananse Weaving",
    image: "/lovable-uploads/8bd685d2-cad8-4639-982a-cb5c7087443c.png",
    category: "Accessories",
    location: "Kumasi",
    isVerified: true,
  },
];

const categories = [
  "All Categories",
  "Ready to Wear",
  "Bridal",
  "Tailoring",
  "Accessories",
];

const locations = [
  "All Locations",
  "Lagos",
  "Accra",
  "Nairobi",
  "Johannesburg",
  "Dakar",
  "Abuja",
  "Marrakech",
  "Cairo",
  "Kumasi",
];

export default function Directory() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "All Categories"
  );
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [showFilters, setShowFilters] = useState(false);
  const [displayedBrands, setDisplayedBrands] = useState(allBrands);
  const [isGridView, setIsGridView] = useState(true);

  // Filter brands based on search, category, and location
  useEffect(() => {
    let filtered = allBrands;

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

    setDisplayedBrands(filtered);
  }, [searchTerm, selectedCategory, selectedLocation]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All Categories");
    setSelectedLocation("All Locations");
    setDisplayedBrands(allBrands);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/50 to-white py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          title="Designer Directory"
          subtitle="Discover and connect with Africa's most innovative fashion designers"
          centered={true}
          titleClassName="text-4xl md:text-5xl font-canela"
          subtitleClassName="text-base text-oma-cocoa/80 mt-2"
        />

        {/* Search and Filter Section */}
        <div className="mt-12">
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-oma-cocoa/50" />
              <Input
                type="text"
                placeholder="Search designers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
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

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Location</Label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <Separator className="my-8" />

        {/* Results Section */}
        <div
          className={cn(
            "grid gap-6",
            isGridView
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1"
          )}
        >
          {displayedBrands.map((brand) => (
            <BrandCard key={brand.id} {...brand} isPortrait={!isGridView} />
          ))}
        </div>

        {displayedBrands.length === 0 && (
          <div className="text-center py-12">
            <p className="text-oma-cocoa">
              No designers found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
