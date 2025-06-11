"use client";

import { useState, useEffect } from "react";
import { Search, Grid, List, Filter } from "lucide-react";
import { getCataloguesWithBrands } from "@/lib/services/catalogueService";
import { Catalogue, Brand } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

type CatalogueWithBrand = Catalogue & {
  brand: {
    name: string;
    id: string;
    location: string;
    is_verified: boolean;
    category: string;
  };
};

// Smart focal point detection for fashion/catalogue images
const getImageFocalPoint = (
  imageUrl: string,
  title: string,
  category?: string
) => {
  // For fashion and catalogue images, we typically want to focus on the upper portion
  // where faces, necklines, and key design elements are usually located
  const lowerTitle = title.toLowerCase();
  const lowerCategory = category?.toLowerCase() || "";

  if (
    lowerTitle.includes("bridal") ||
    lowerTitle.includes("wedding") ||
    lowerCategory.includes("bridal")
  ) {
    return "object-top"; // Focus on top for bridal shots to capture face/neckline
  }

  if (
    lowerTitle.includes("evening") ||
    lowerTitle.includes("gown") ||
    lowerCategory.includes("evening")
  ) {
    return "object-center"; // Center for full gown shots
  }

  if (
    lowerCategory.includes("accessories") ||
    lowerTitle.includes("accessories")
  ) {
    return "object-center"; // Center for accessories to show the full item
  }

  // Default to top-center for most fashion photography to avoid cutting off faces
  return "object-top";
};

export default function CataloguesPage() {
  const [catalogues, setCatalogues] = useState<CatalogueWithBrand[]>([]);
  const [filteredCatalogues, setFilteredCatalogues] = useState<
    CatalogueWithBrand[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    async function fetchCatalogues() {
      try {
        setLoading(true);
        const data = await getCataloguesWithBrands();
        setCatalogues(data);
        setFilteredCatalogues(data);
      } catch (err) {
        console.error("Error fetching catalogues:", err);
        setError("Failed to load catalogue information");
      } finally {
        setLoading(false);
      }
    }

    fetchCatalogues();
  }, []);

  useEffect(() => {
    let filtered = catalogues;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (catalogue) =>
          catalogue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          catalogue.brand.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          catalogue.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (catalogue) => catalogue.brand.category === selectedCategory
      );
    }

    setFilteredCatalogues(filtered);
  }, [catalogues, searchTerm, selectedCategory]);

  const categories = [
    "all",
    ...Array.from(new Set(catalogues.map((c) => c.brand.category))),
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="animate-pulse">
            <div className="h-12 bg-oma-cocoa/10 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="h-48 bg-oma-cocoa/10 rounded-lg mb-4"></div>
                  <div className="h-6 bg-oma-cocoa/10 rounded mb-2"></div>
                  <div className="h-4 bg-oma-cocoa/10 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center">
            <h1 className="text-3xl font-canela text-oma-cocoa mb-4">
              Something went wrong
            </h1>
            <p className="text-oma-cocoa/70 mb-8">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-oma-plum text-white px-6 py-3 rounded-lg hover:bg-oma-plum/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-canela text-black mb-6">
            Designer Catalogues
          </h1>
          <p className="text-xl text-oma-cocoa/80 max-w-3xl mx-auto">
            Explore curated catalogues from Africa's most talented designers
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black/40 w-5 h-5" />
              <input
                type="text"
                placeholder="Search catalogues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-oma-cocoa/20 rounded-lg focus:outline-none focus:border-oma-plum/50 bg-white/80 text-black placeholder-black/50"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex bg-white/80 rounded-lg p-1 border border-oma-cocoa/20">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "grid"
                      ? "bg-oma-plum text-white"
                      : "text-black/60 hover:text-black"
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "list"
                      ? "bg-oma-plum text-white"
                      : "text-black/60 hover:text-black"
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="mt-6 flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-oma-plum text-white"
                    : "bg-white/80 text-black/70 hover:bg-oma-cocoa/10 border border-oma-cocoa/20"
                }`}
              >
                {category === "all" ? "All Categories" : category}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-8">
          <p className="text-black/60">
            {filteredCatalogues.length} catalogue
            {filteredCatalogues.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Catalogues Grid/List */}
        {filteredCatalogues.length === 0 ? (
          <div className="text-center py-16">
            <Filter className="w-16 h-16 text-black/30 mx-auto mb-4" />
            <h3 className="text-xl font-canela text-black mb-2">
              No catalogues found
            </h3>
            <p className="text-black/60">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                : "space-y-6"
            }
          >
            {filteredCatalogues.map((catalogue) => (
              <Link
                key={catalogue.id}
                href={`/catalogue/${catalogue.id}`}
                className={`group block ${
                  viewMode === "list"
                    ? "bg-white/80 rounded-xl p-6 border border-oma-gold/10 hover:border-oma-gold/30 transition-all duration-300 hover:shadow-lg"
                    : ""
                }`}
              >
                {viewMode === "grid" ? (
                  <div className="bg-white/80 rounded-xl overflow-hidden border border-oma-gold/10 hover:border-oma-gold/30 transition-all duration-300 hover:shadow-lg group-hover:-translate-y-1">
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <Image
                        src={catalogue.image}
                        alt={catalogue.title}
                        fill
                        className={`object-cover ${getImageFocalPoint(catalogue.image, catalogue.title, catalogue.brand.category)} group-hover:scale-105 transition-transform duration-300`}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={false}
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-canela text-black mb-2 group-hover:text-oma-plum transition-colors">
                        {catalogue.title}
                      </h3>
                      <p className="text-black/70 mb-3 line-clamp-2">
                        {catalogue.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-black">
                            {catalogue.brand.name}
                          </p>
                          <p className="text-xs text-black/60">
                            {catalogue.brand.location}
                          </p>
                        </div>
                        {catalogue.brand.is_verified && (
                          <div className="bg-oma-gold/20 text-black text-xs px-2 py-1 rounded-full">
                            Verified
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-6">
                    <div className="w-48 h-36 relative overflow-hidden rounded-lg flex-shrink-0">
                      <Image
                        src={catalogue.image}
                        alt={catalogue.title}
                        fill
                        className={`object-cover ${getImageFocalPoint(catalogue.image, catalogue.title, catalogue.brand.category)} group-hover:scale-105 transition-transform duration-300`}
                        sizes="192px"
                        priority={false}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-canela text-black mb-2 group-hover:text-oma-plum transition-colors">
                        {catalogue.title}
                      </h3>
                      <p className="text-black/70 mb-3 line-clamp-2">
                        {catalogue.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-black">
                            {catalogue.brand.name}
                          </p>
                          <p className="text-xs text-black/60">
                            {catalogue.brand.location}
                          </p>
                        </div>
                        {catalogue.brand.is_verified && (
                          <div className="bg-oma-gold/20 text-black text-xs px-2 py-1 rounded-full">
                            Verified
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
