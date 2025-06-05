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
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-canela text-gray-900 mb-4">
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
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-300 focus:border-oma-plum"
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
                    ? "bg-oma-plum text-white"
                    : "text-gray-600"
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
                    ? "bg-oma-plum text-white"
                    : "text-gray-600"
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
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-6 rounded-lg bg-gray-50 border border-gray-200">
              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-oma-plum focus:outline-none"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">
                  Designer
                </label>
                <select
                  value={selectedDesigner}
                  onChange={(e) => setSelectedDesigner(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-oma-plum focus:outline-none"
                >
                  {uniqueDesigners.map((designer) => (
                    <option key={designer} value={designer}>
                      {designer}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={clearAllFilters}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  Clear Filters
                </Button>
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
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredCollections.length} of {collections.length}{" "}
            collections
          </p>
        </div>

        {/* Collections Grid/List */}
        {filteredCollections.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No collections found
            </h3>
            <p className="text-gray-600 mb-4">
              {collections.length === 0
                ? "No collections have been created yet."
                : "Try adjusting your search or filters."}
            </p>
            {collections.length > 0 && (
              <Button
                onClick={clearAllFilters}
                className="bg-oma-plum hover:bg-oma-plum/90"
              >
                Reset Filters
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCollections.map((collection) => (
              <NavigationLink
                key={collection.id}
                href={`/collection/${collection.id}`}
                className="group block"
              >
                <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 hover:border-oma-plum/30">
                  <div className="aspect-square relative overflow-hidden bg-gray-100">
                    <AuthImage
                      src={collection.image}
                      alt={collection.title}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-oma-plum transition-colors mb-2">
                      {collection.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {collection.brand.name}
                      </span>
                      {collection.brand.is_verified && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {collection.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {collection.brand.category}
                      </span>
                      <span>{collection.brand.location}</span>
                    </div>
                  </div>
                </div>
              </NavigationLink>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCollections.map((collection) => (
              <NavigationLink
                key={collection.id}
                href={`/collection/${collection.id}`}
                className="group block"
              >
                <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 hover:border-oma-plum/30">
                  <div className="flex items-center gap-6 p-6">
                    <div className="w-24 h-24 relative rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <AuthImage
                        src={collection.image}
                        alt={collection.title}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-gray-900 group-hover:text-oma-plum transition-colors">
                            {collection.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">
                              {collection.brand.name}
                            </span>
                            {collection.brand.is_verified && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Verified
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {collection.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              {collection.brand.category}
                            </span>
                            <span>{collection.brand.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </NavigationLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
