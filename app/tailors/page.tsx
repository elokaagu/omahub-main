"use client";

import React, { useState, useEffect } from "react";
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
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandCard } from "@/components/ui/brand-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loading } from "@/components/ui/loading";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  StaggerContainer,
  StaggerItem,
  FadeIn,
  SlideUp,
} from "@/app/components/ui/animations";
import { UNIFIED_CATEGORIES } from "@/lib/data/unified-categories";

type TailorWithBrand = Tailor & {
  brand: {
    name: string;
    id: string;
    location: string;
    is_verified: boolean;
    category: string;
    video_url?: string;
    video_thumbnail?: string;
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

// Mapping from unified category names to actual specialties
const categoryToSpecialtiesMap: Record<string, string[]> = {
  Bridal: ["Wedding Dresses", "Bridal Wear", "Evening Gowns", "Bridal"],
  "Custom Design": [
    "Custom Design",
    "Bespoke Garments",
    "Made-to-Measure",
    "Bespoke Tailoring",
  ],
  "Made to Measure": [
    "Made-to-Measure",
    "Custom Fit",
    "Bespoke Tailoring",
    "Custom Design",
  ],
  Alterations: ["Alterations", "Hemming", "Resizing", "Repairs"],
};

export default function TailorsPage() {
  const searchParams = useSearchParams();
  const [tailors, setTailors] = useState<TailorWithBrand[]>([]);
  const [filteredTailors, setFilteredTailors] = useState<TailorWithBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Tailored categories for filter dropdown
  const tailoredCategories = UNIFIED_CATEGORIES.filter((cat) =>
    ["bridal", "custom-design", "made-to-measure", "alterations"].includes(
      cat.id
    )
  );

  // Sync selectedCategory with specialty query param
  useEffect(() => {
    const specialty = searchParams.get("specialty");
    if (
      specialty &&
      tailoredCategories.some((cat) => cat.displayName === specialty)
    ) {
      setSelectedCategory(specialty);
    } else if (!specialty) {
      setSelectedCategory("");
    }
  }, [searchParams, tailoredCategories]);

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

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(
        (tailor) => tailor.brand.category === selectedCategory
      );
    }

    // Filter by specialty query param
    const specialty = searchParams.get("specialty");
    if (specialty) {
      // Get the mapped specialties for this category
      const mappedSpecialties = categoryToSpecialtiesMap[specialty] || [
        specialty,
      ];

      filtered = filtered.filter((tailor) => {
        if (!tailor.specialties) return false;
        let specialtiesArr: string[] = [];
        if (Array.isArray(tailor.specialties)) {
          specialtiesArr = tailor.specialties as string[];
        } else if (typeof tailor.specialties === "string") {
          specialtiesArr = (tailor.specialties as string)
            .split(",")
            .map((s: string) => s.trim());
        }

        // Check if any of the mapped specialties match the tailor's specialties
        return specialtiesArr.some((tailorSpecialty) =>
          mappedSpecialties.some(
            (mappedSpecialty) =>
              tailorSpecialty
                .toLowerCase()
                .includes(mappedSpecialty.toLowerCase()) ||
              mappedSpecialty
                .toLowerCase()
                .includes(tailorSpecialty.toLowerCase())
          )
        );
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (tailor) =>
          tailor.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tailor.brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tailor.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTailors(filtered);
  }, [tailors, searchTerm, searchParams, selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="animate-pulse">
            <div className="h-12 bg-oma-cocoa/10 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
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
        <div className="max-w-7xl mx-auto px-6 py-12">
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
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <FadeIn>
          <div className="text-center mb-12">
            <h1 className="text-5xl font-canela text-black mb-4">
              Our Designers
            </h1>
            <p className="text-xl text-oma-cocoa/80 max-w-3xl mx-auto">
              Discover skilled artisans creating bespoke garments with precision
              and passion
            </p>
          </div>
        </FadeIn>

        {/* Search and Filters */}
        <SlideUp delay={0.2}>
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
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
              {/* Category Filter */}
              <div className="w-full max-w-xs">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {tailoredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.displayName}>
                        {cat.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          </div>
        </SlideUp>

        {/* Tailors Grid/List */}
        <AnimatePresence mode="wait">
          {viewMode === "grid" ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTailors.map((tailor, index) =>
                  tailor.brand ? (
                    <StaggerItem key={tailor.id} index={index}>
                      <motion.div
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="overflow-hidden flex flex-col h-full cursor-pointer group">
                          {/* Make image much larger vertically */}
                          <div className="w-full h-[500px] bg-gray-100 overflow-hidden">
                            <BrandCard
                              id={tailor.brand.id}
                              name={tailor.brand.name}
                              image={tailor.image}
                              category={tailor.brand.category}
                              location={tailor.brand.location}
                              isVerified={tailor.brand.is_verified}
                              video_url={tailor.brand.video_url}
                              video_thumbnail={tailor.brand.video_thumbnail}
                              className="h-full"
                            />
                          </div>
                          <div className="flex-1 flex flex-col p-4">
                            <div className="font-canela text-xl text-black mb-1">
                              {tailor.title}
                            </div>
                            {tailor.price_range && (
                              <div className="text-base text-black mb-1">
                                {tailor.price_range}
                              </div>
                            )}
                            <div className="text-sm text-black mb-1">
                              {tailor.brand.category}
                            </div>
                            <div className="text-sm text-black mb-4">
                              {tailor.brand.location}
                            </div>
                            <div className="flex justify-end mt-auto">
                              <Link href={`/tailor/${tailor.id}`}>
                                <Button className="bg-oma-plum text-white hover:bg-oma-plum/90 transition-colors">
                                  View Details
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    </StaggerItem>
                  ) : null
                )}
              </StaggerContainer>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <StaggerContainer className="space-y-4">
                {filteredTailors.map((tailor, index) =>
                  tailor.brand ? (
                    <StaggerItem key={tailor.id} index={index}>
                      <motion.div
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="overflow-hidden cursor-pointer group">
                          <div className="flex">
                            {/* Make image much larger vertically */}
                            <div className="w-48 h-64 bg-gray-100 overflow-hidden flex-shrink-0">
                              <BrandCard
                                id={tailor.brand.id}
                                name={tailor.brand.name}
                                image={tailor.image}
                                category={tailor.brand.category}
                                location={tailor.brand.location}
                                isVerified={tailor.brand.is_verified}
                                video_url={tailor.brand.video_url}
                                video_thumbnail={tailor.brand.video_thumbnail}
                                className="h-full"
                              />
                            </div>
                            <div className="flex-1 flex flex-col justify-between p-4">
                              <div>
                                <div className="font-canela text-xl text-black mb-1">
                                  {tailor.title}
                                </div>
                                {tailor.price_range && (
                                  <div className="text-base text-black mb-1">
                                    {tailor.price_range}
                                  </div>
                                )}
                                <div className="text-sm text-black mb-1">
                                  {tailor.brand.category}
                                </div>
                                <div className="text-sm text-black">
                                  {tailor.brand.location}
                                </div>
                              </div>
                              <div className="flex justify-end mt-4">
                                <Link href={`/tailor/${tailor.id}`}>
                                  <Button className="bg-oma-plum text-white hover:bg-oma-plum/90 transition-colors">
                                    View Details
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    </StaggerItem>
                  ) : null
                )}
              </StaggerContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
// Note: The tailored nav dropdown is already connected to /tailors in navigation logic.
