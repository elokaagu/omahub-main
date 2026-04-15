"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Search, Grid, List } from "lucide-react";
import { getTailorsWithBrands } from "@/lib/services/tailorService";
import { Tailor } from "@/lib/supabase";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BrandCard } from "@/components/ui/brand-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  StaggerContainer,
  StaggerItem,
  FadeIn,
  SlideUp,
} from "@/app/components/ui/animations";
import { getCategoriesForDirectory } from "@/lib/data/unified-categories";

// Curated subset of category IDs for tailors
const CURATED_CATEGORY_IDS = [
  "bridal",
  "custom-design",
  "made-to-measure",
  "alterations",
];

const tailoredCategories = getCategoriesForDirectory().filter((cat) =>
  CURATED_CATEGORY_IDS.includes(cat.id)
);

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

const ALL_CATEGORIES_VALUE = "__all";

function normalizeSpecialties(
  specialties: TailorWithBrand["specialties"] | string | null | undefined
): string[] {
  if (specialties == null || specialties === "") return [];
  if (Array.isArray(specialties)) {
    return specialties
      .map((specialty) => String(specialty).trim())
      .filter(Boolean);
  }
  if (typeof specialties === "string") {
    return specialties
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function matchesCategoryOrSpecialty(
  tailor: TailorWithBrand,
  category: string
): boolean {
  if (tailor.brand?.category === category) return true;
  const mappedSpecialties = categoryToSpecialtiesMap[category] ?? [category];
  const specialties = normalizeSpecialties(tailor.specialties);
  return specialties.some((tailorSpecialty) =>
    mappedSpecialties.some((mappedSpecialty) => {
      const tailorValue = tailorSpecialty.toLowerCase();
      const mappedValue = mappedSpecialty.toLowerCase();
      return tailorValue.includes(mappedValue) || mappedValue.includes(tailorValue);
    })
  );
}

function TailorDirectoryMeta({ tailor }: { tailor: TailorWithBrand }) {
  return (
    <>
      <div className="font-canela text-xl text-black mb-1">
        {tailor.brand.name || tailor.title}
      </div>
      <div className="text-sm text-black mb-1">{tailor.brand.category}</div>
      <div className="text-sm text-black">{tailor.brand.location}</div>
    </>
  );
}

function TailorDirectoryAction({ tailorId }: { tailorId: string }) {
  return (
    <Link href={`/tailor/${tailorId}`}>
      <Button className="bg-oma-plum text-white hover:bg-oma-plum/90 transition-colors">
        View Details
      </Button>
    </Link>
  );
}

export default function TailorsPage() {
  const searchParams = useSearchParams();
  const [tailors, setTailors] = useState<TailorWithBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const specialtyFromQuery = (searchParams.get("specialty") || "").trim();

  // Sync selectedCategory with specialty query param
  useEffect(() => {
    if (
      specialtyFromQuery &&
      tailoredCategories.some((cat) => cat.name === specialtyFromQuery)
    ) {
      setSelectedCategory(specialtyFromQuery);
    } else if (!specialtyFromQuery) {
      setSelectedCategory("");
    }
  }, [specialtyFromQuery]);

  useEffect(() => {
    async function fetchTailors() {
      try {
        setLoading(true);
        const data = await getTailorsWithBrands();
        setTailors(data);
      } catch (err) {
        console.error("Error fetching tailors:", err);
        setError("Failed to load tailor information");
      } finally {
        setLoading(false);
      }
    }

    fetchTailors();
  }, []);

  const filteredTailors = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    const activeCategory = selectedCategory || specialtyFromQuery;

    return tailors
      .filter((tailor) => Boolean(tailor.brand))
      .filter((tailor) =>
        activeCategory ? matchesCategoryOrSpecialty(tailor, activeCategory) : true
      )
      .filter((tailor) => {
        if (!normalizedSearchTerm) return true;
        return (
          tailor.title.toLowerCase().includes(normalizedSearchTerm) ||
          tailor.brand.name.toLowerCase().includes(normalizedSearchTerm) ||
          tailor.description?.toLowerCase().includes(normalizedSearchTerm)
        );
      });
  }, [tailors, selectedCategory, specialtyFromQuery, searchTerm]);

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
                  value={selectedCategory || ALL_CATEGORIES_VALUE}
                  onValueChange={(value) =>
                    setSelectedCategory(
                      value === ALL_CATEGORIES_VALUE ? "" : value
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_CATEGORIES_VALUE}>
                      All Categories
                    </SelectItem>
                    {tailoredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
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
                            <TailorDirectoryMeta tailor={tailor} />
                            <div className="flex justify-end mt-auto">
                              <TailorDirectoryAction tailorId={tailor.id} />
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
                                <TailorDirectoryMeta tailor={tailor} />
                              </div>
                              <div className="flex justify-end mt-4">
                                <TailorDirectoryAction tailorId={tailor.id} />
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
