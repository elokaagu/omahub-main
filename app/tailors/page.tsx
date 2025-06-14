"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Grid,
  List,
  Filter,
  Scissors,
  Clock,
  DollarSign,
} from "lucide-react";
import { getTailorsWithBrands } from "@/lib/services/tailorService";
import { Tailor, Brand } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

type TailorWithBrand = Tailor & {
  brand: {
    name: string;
    id: string;
    location: string;
    is_verified: boolean;
    category: string;
  };
};

// Smart focal point detection for fashion/tailor images
const getImageFocalPoint = (imageUrl: string, title: string) => {
  // For fashion and tailor images, we typically want to focus on the upper portion
  // where faces, necklines, and key design elements are usually located
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("bridal") || lowerTitle.includes("wedding")) {
    return "object-top"; // Focus on top for bridal shots to capture face/neckline
  }

  if (lowerTitle.includes("evening") || lowerTitle.includes("gown")) {
    return "object-center"; // Center for full gown shots
  }

  // Default to top-center for most fashion photography to avoid cutting off faces
  return "object-top";
};

export default function TailorsPage() {
  const [tailors, setTailors] = useState<TailorWithBrand[]>([]);
  const [filteredTailors, setFilteredTailors] = useState<TailorWithBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    async function fetchTailors() {
      try {
        setLoading(true);
        const data = await getTailorsWithBrands();
        setTailors(data);
        setFilteredTailors(data);
      } catch (err) {
        console.error("Error fetching tailors:", err);
        setError("Failed to load tailor information");
      } finally {
        setLoading(false);
      }
    }

    fetchTailors();
  }, []);

  useEffect(() => {
    let filtered = tailors;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (tailor) =>
          tailor.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tailor.brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tailor.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          tailor.specialties?.some((specialty) =>
            specialty.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Filter by specialty
    if (selectedSpecialty !== "all") {
      filtered = filtered.filter((tailor) =>
        tailor.specialties?.includes(selectedSpecialty)
      );
    }

    setFilteredTailors(filtered);
  }, [tailors, searchTerm, selectedSpecialty]);

  // Get all unique specialties for filtering
  const specialties = [
    "all",
    ...Array.from(new Set(tailors.flatMap((t) => t.specialties || []))),
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
            0ur Designers
          </h1>
          <p className="text-xl text-oma-cocoa/80 max-w-3xl mx-auto">
            Discover skilled artisans creating bespoke garments with precision
            and passion
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
                placeholder="Search tailors..."
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

          {/* Specialty Filter */}
          <div className="mt-6 flex flex-wrap gap-3">
            {specialties.map((specialty) => (
              <button
                key={specialty}
                onClick={() => setSelectedSpecialty(specialty)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedSpecialty === specialty
                    ? "bg-oma-plum text-white"
                    : "bg-white/80 text-black/70 hover:bg-oma-cocoa/10 border border-oma-cocoa/20"
                }`}
              >
                {specialty === "all" ? "All Specialties" : specialty}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-8">
          <p className="text-black/60">
            {filteredTailors.length} tailor
            {filteredTailors.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Tailors Grid/List */}
        {filteredTailors.length === 0 ? (
          <div className="text-center py-16">
            <Scissors className="w-16 h-16 text-black/30 mx-auto mb-4" />
            <h3 className="text-xl font-canela text-black mb-2">
              No tailors found
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
            {filteredTailors.map((tailor) => (
              <Link
                key={tailor.id}
                href={`/tailor/${tailor.id}`}
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
                        src={tailor.image}
                        alt={tailor.title}
                        fill
                        className={`object-cover ${getImageFocalPoint(tailor.image, tailor.title)} group-hover:scale-105 transition-transform duration-300`}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={false}
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-canela text-black mb-2 group-hover:text-oma-plum transition-colors">
                        {tailor.title}
                      </h3>
                      <p className="text-black/70 mb-3 line-clamp-2">
                        {tailor.description}
                      </p>

                      {/* Specialties */}
                      {tailor.specialties && tailor.specialties.length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {tailor.specialties
                              .slice(0, 3)
                              .map((specialty, index) => (
                                <span
                                  key={index}
                                  className="text-xs bg-oma-beige/50 text-black px-2 py-1 rounded-full"
                                >
                                  {specialty}
                                </span>
                              ))}
                            {tailor.specialties.length > 3 && (
                              <span className="text-xs text-black/60">
                                +{tailor.specialties.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Tailor Info */}
                      <div className="space-y-2 mb-4">
                        {tailor.price_range && (
                          <div className="flex items-center gap-2 text-sm text-black/70">
                            <DollarSign className="w-4 h-4" />
                            <span>{tailor.price_range}</span>
                          </div>
                        )}
                        {tailor.lead_time && (
                          <div className="flex items-center gap-2 text-sm text-black/70">
                            <Clock className="w-4 h-4" />
                            <span>{tailor.lead_time}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-black">
                            {tailor.brand.name}
                          </p>
                          <p className="text-xs text-black/60">
                            {tailor.brand.location}
                          </p>
                        </div>
                        {tailor.brand.is_verified && (
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
                        src={tailor.image}
                        alt={tailor.title}
                        fill
                        className={`object-cover ${getImageFocalPoint(tailor.image, tailor.title)} group-hover:scale-105 transition-transform duration-300`}
                        sizes="192px"
                        priority={false}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-canela text-black mb-2 group-hover:text-oma-plum transition-colors">
                        {tailor.title}
                      </h3>
                      <p className="text-black/70 mb-3 line-clamp-2">
                        {tailor.description}
                      </p>

                      {/* Specialties */}
                      {tailor.specialties && tailor.specialties.length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {tailor.specialties
                              .slice(0, 4)
                              .map((specialty, index) => (
                                <span
                                  key={index}
                                  className="text-xs bg-oma-beige/50 text-black px-2 py-1 rounded-full"
                                >
                                  {specialty}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm font-medium text-black">
                              {tailor.brand.name}
                            </p>
                            <p className="text-xs text-black/60">
                              {tailor.brand.location}
                            </p>
                          </div>
                          {tailor.price_range && (
                            <div className="flex items-center gap-1 text-sm text-black/70">
                              <DollarSign className="w-4 h-4" />
                              <span>{tailor.price_range}</span>
                            </div>
                          )}
                          {tailor.lead_time && (
                            <div className="flex items-center gap-1 text-sm text-black/70">
                              <Clock className="w-4 h-4" />
                              <span>{tailor.lead_time}</span>
                            </div>
                          )}
                        </div>
                        {tailor.brand.is_verified && (
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
