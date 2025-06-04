"use client";

import { useState, useEffect } from "react";
import { getCollectionsWithBrands } from "@/lib/services/collectionService";
import { Collection } from "@/lib/supabase";
import { AuthImage } from "@/components/ui/auth-image";
import { NavigationLink } from "@/components/ui/navigation-link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, LayoutGrid, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loading } from "@/components/ui/loading";

type CollectionWithBrand = Collection & {
  brand: {
    name: string;
    id: string;
    location: string;
    is_verified: boolean;
  };
};

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionWithBrand[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<
    CollectionWithBrand[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    filterCollections();
  }, [searchQuery, collections]);

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

    setFilteredCollections(filtered);
  };

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
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-9 w-9 p-0"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-9 w-9 p-0"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredCollections.length} collection
            {filteredCollections.length !== 1 ? "s" : ""} found
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
            <p className="text-gray-600">
              {searchQuery
                ? "Try adjusting your search terms or browse all collections."
                : "No collections are currently available."}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
                className="mt-4"
              >
                Clear Search
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
                      <p className="text-xs text-gray-500">
                        {collection.brand.location}
                      </p>
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
                      <p className="text-xs text-gray-500 mb-2">
                        {collection.brand.location}
                      </p>
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
