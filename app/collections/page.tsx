"use client";

import { useState, useEffect } from "react";
import { getCollectionsWithBrands } from "@/lib/services/collectionService";
import { Collection } from "@/lib/supabase";
import { AuthImage } from "@/components/ui/auth-image";
import { NavigationLink } from "@/components/ui/navigation-link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, LayoutGrid, LayoutList, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loading } from "@/components/ui/loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 sm:px-6 py-16">
          <div className="flex justify-center items-center h-64">
            <Loading />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 sm:px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-canela text-gray-900 mb-4">
            Collections Directory
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover curated collections from talented designers and brands.
            Each collection tells a unique story through carefully crafted
            pieces.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col gap-4">
            {/* Search and View Toggle Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search collections or brands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="bg-oma-plum text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
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

                <div className="flex items-center gap-1 border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-9 w-9 p-0 rounded-r-none"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="h-9 w-9 p-0 rounded-l-none"
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Filters Row */}
            {showFilters && (
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designer
                  </label>
                  <Select
                    value={selectedDesigner}
                    onValueChange={setSelectedDesigner}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select designer" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueDesigners.map((designer) => (
                        <SelectItem key={designer} value={designer}>
                          {designer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllFilters}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear All
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

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
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredCollections.length} collection
            {filteredCollections.length !== 1 ? "s" : ""} found
            {hasActiveFilters && ` (filtered from ${collections.length} total)`}
          </p>
        </div>

        {/* Collections Grid */}
        {filteredCollections.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No collections found
            </h3>
            <p className="text-gray-600 mb-4">
              {hasActiveFilters
                ? "Try adjusting your filters or search terms."
                : "No collections are currently available."}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="mt-4"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            )}
          >
            {filteredCollections.map((collection) => (
              <NavigationLink
                key={collection.id}
                href={`/collection/${collection.id}`}
                className="group block"
              >
                {viewMode === "grid" ? (
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
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
                      <h3 className="font-semibold text-gray-900 group-hover:text-oma-plum transition-colors mb-1">
                        {collection.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        by {collection.brand.name}
                        {collection.brand.is_verified && (
                          <span className="ml-1 text-green-600">✓</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span className="px-2 py-1 bg-gray-100 rounded">
                          {collection.brand.category}
                        </span>
                        <span>•</span>
                        <span>{collection.brand.location}</span>
                      </div>
                      {collection.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {collection.description}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 flex gap-4">
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
                      <h3 className="font-semibold text-gray-900 group-hover:text-oma-plum transition-colors mb-1">
                        {collection.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        by {collection.brand.name}
                        {collection.brand.is_verified && (
                          <span className="ml-1 text-green-600">✓</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span className="px-2 py-1 bg-gray-100 rounded">
                          {collection.brand.category}
                        </span>
                        <span>•</span>
                        <span>{collection.brand.location}</span>
                      </div>
                      {collection.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
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
