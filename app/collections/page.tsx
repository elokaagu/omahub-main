"use client";

import { useState, useEffect } from "react";
import { getCollectionsWithBrands } from "@/lib/services/collectionService";
import { Collection } from "@/lib/supabase";
import { AuthImage } from "@/components/ui/auth-image";
import { NavigationLink } from "@/components/ui/navigation-link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Search, Filter, LayoutGrid, LayoutList, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loading } from "@/components/ui/loading";

type CollectionWithBrand = Collection & {
  brand: {
    name: string;
    id: string;
    location: string;
    is_verified: boolean;
    category: string;
  };
};

// Define the main categories based on the established system
const CATEGORIES = [
  "All Categories",
  "Bridal",
  "Ready to Wear",
  "Tailoring",
  "Accessories",
  "Collections",
  "Tailored",
];

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionWithBrand[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<
    CollectionWithBrand[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedDesigner, setSelectedDesigner] = useState("All Designers");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Get unique designers from collections
  const uniqueDesigners = [
    "All Designers",
    ...Array.from(new Set(collections.map((c) => c.brand.name))).sort(),
  ];

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    filterCollections();
  }, [searchQuery, selectedCategory, selectedDesigner, collections]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const collectionsData = await getCollectionsWithBrands();
      setCollections(collectionsData);
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterCollections = () => {
    let filtered = collections;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (collection) =>
          collection.title.toLowerCase().includes(query) ||
          collection.brand.name.toLowerCase().includes(query) ||
          (collection.description &&
            collection.description.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter(
        (collection) => collection.brand.category === selectedCategory
      );
    }

    // Filter by designer
    if (selectedDesigner !== "All Designers") {
      filtered = filtered.filter(
        (collection) => collection.brand.name === selectedDesigner
      );
    }

    setFilteredCollections(filtered);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All Categories");
    setSelectedDesigner("All Designers");
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCategory !== "All Categories" ||
    selectedDesigner !== "All Designers";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-canela text-gray-900 mb-4">
            Collections Directory
          </h1>
          <p className="text-lg text-oma-cocoa/80 max-w-2xl mx-auto">
            Discover curated collections from talented designers and brands.
            Each collection tells a unique story through carefully crafted
            pieces.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-oma-cocoa" />
              <Input
                type="search"
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-oma-cocoa/20 focus:border-oma-plum/50"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "w-10 h-10",
                  viewMode === "grid"
                    ? "bg-oma-beige text-oma-plum"
                    : "text-oma-cocoa"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode("list")}
                className={cn(
                  "w-10 h-10",
                  viewMode === "list"
                    ? "bg-oma-beige text-oma-plum"
                    : "text-oma-cocoa"
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
                {hasActiveFilters && (
                  <span className="bg-oma-plum text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2">
                    {
                      [
                        searchQuery,
                        selectedCategory !== "All Categories",
                        selectedDesigner !== "All Designers",
                      ].filter(Boolean).length
                    }
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                className="md:w-auto w-full border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
                onClick={clearAllFilters}
              >
                Show All Collections
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-6 rounded-lg bg-oma-beige/50 border border-oma-gold/10">
              <div>
                <Label className="text-oma-cocoa">Category</Label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md border-oma-gold/20 focus:border-oma-plum"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-oma-cocoa">Designer</Label>
                <select
                  value={selectedDesigner}
                  onChange={(e) => setSelectedDesigner(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md border-oma-gold/20 focus:border-oma-plum"
                >
                  {uniqueDesigners.map((designer) => (
                    <option key={designer} value={designer}>
                      {designer}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <Separator className="my-8 bg-oma-gold/10" />

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap gap-2">
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-oma-plum/10 text-oma-plum rounded-full text-sm">
                Search: "{searchQuery}"
                <button
                  onClick={() => setSearchQuery("")}
                  className="hover:bg-oma-plum/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedCategory !== "All Categories" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-oma-plum/10 text-oma-plum rounded-full text-sm">
                Category: {selectedCategory}
                <button
                  onClick={() => setSelectedCategory("All Categories")}
                  className="hover:bg-oma-plum/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedDesigner !== "All Designers" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-oma-plum/10 text-oma-plum rounded-full text-sm">
                Designer: {selectedDesigner}
                <button
                  onClick={() => setSelectedDesigner("All Designers")}
                  className="hover:bg-oma-plum/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-oma-cocoa">
            Showing {filteredCollections.length} collection
            {filteredCollections.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Collections Grid */}
        {filteredCollections.length === 0 ? (
          <div className="text-center py-12 bg-oma-beige/30 rounded-lg p-8">
            <div className="text-oma-cocoa/40 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-oma-cocoa mb-2">
              No collections found
            </h3>
            <p className="text-oma-cocoa/70 mb-4">
              {hasActiveFilters
                ? "Try adjusting your filters or search terms."
                : "No collections are currently available."}
            </p>
            {hasActiveFilters && (
              <Button
                onClick={clearAllFilters}
                className="mt-4 bg-oma-plum hover:bg-oma-plum/90"
              >
                Reset Filters
              </Button>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-6",
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            )}
          >
            {filteredCollections.map((collection) => (
              <NavigationLink
                key={collection.id}
                href={`/collection/${collection.id}`}
                className="group block"
              >
                {viewMode === "grid" ? (
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-oma-gold/10 hover:border-oma-plum/20">
                    <div className="aspect-square relative overflow-hidden">
                      <AuthImage
                        src={collection.image}
                        alt={collection.title}
                        width={400}
                        height={400}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-oma-cocoa group-hover:text-oma-plum transition-colors mb-1">
                        {collection.title}
                      </h3>
                      <p className="text-sm text-oma-cocoa/70 mb-2">
                        by {collection.brand.name}
                        {collection.brand.is_verified && (
                          <span className="ml-1 text-green-600">✓</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-oma-cocoa/60 mb-2">
                        <span className="px-2 py-1 bg-oma-beige/50 rounded text-oma-plum">
                          {collection.brand.category}
                        </span>
                        <span>•</span>
                        <span>{collection.brand.location}</span>
                      </div>
                      {collection.description && (
                        <p className="text-sm text-oma-cocoa/70 mt-2 line-clamp-2">
                          {collection.description}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 flex gap-4 border border-oma-gold/10 hover:border-oma-plum/20">
                    <div className="w-24 h-24 flex-shrink-0">
                      <AuthImage
                        src={collection.image}
                        alt={collection.title}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-oma-cocoa group-hover:text-oma-plum transition-colors mb-1">
                        {collection.title}
                      </h3>
                      <p className="text-sm text-oma-cocoa/70 mb-1">
                        by {collection.brand.name}
                        {collection.brand.is_verified && (
                          <span className="ml-1 text-green-600">✓</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-oma-cocoa/60 mb-2">
                        <span className="px-2 py-1 bg-oma-beige/50 rounded text-oma-plum">
                          {collection.brand.category}
                        </span>
                        <span>•</span>
                        <span>{collection.brand.location}</span>
                      </div>
                      {collection.description && (
                        <p className="text-sm text-oma-cocoa/70 line-clamp-2">
                          {collection.description}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </NavigationLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
