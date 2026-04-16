"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Search, Grid, List } from "lucide-react";
import {
  getTailorsWithBrands,
  type TailorRowWithBrand,
} from "@/lib/services/tailorService";
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

const CURATED_CATEGORY_IDS = [
  "bridal",
  "custom-design",
  "made-to-measure",
  "alterations",
];

const tailoredCategories = getCategoriesForDirectory().filter((cat) =>
  CURATED_CATEGORY_IDS.includes(cat.id)
);

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
  specialties: TailorRowWithBrand["specialties"] | string | null | undefined
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
  tailor: TailorRowWithBrand,
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

function TailorDirectoryMeta({ tailor }: { tailor: TailorRowWithBrand }) {
  const brand = tailor.brand;
  return (
    <>
      <div className="mb-1 font-canela text-xl text-black">
        {brand?.name || tailor.title}
      </div>
      <div className="mb-1 text-sm text-black">{brand?.category ?? "—"}</div>
      <div className="text-sm text-black">{brand?.location ?? "—"}</div>
    </>
  );
}

function TailorDirectoryAction({ tailorId }: { tailorId: string }) {
  return (
    <Link href={`/tailor/${tailorId}`}>
      <Button className="bg-oma-plum text-white transition-colors hover:bg-oma-plum/90">
        View Details
      </Button>
    </Link>
  );
}

export function TailorsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="animate-pulse">
          <div className="mb-8 h-12 rounded-lg bg-oma-cocoa/10" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="mb-4 h-48 rounded-lg bg-oma-cocoa/10" />
                <div className="mb-2 h-6 rounded bg-oma-cocoa/10" />
                <div className="h-4 w-2/3 rounded bg-oma-cocoa/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TailorsClient() {
  const searchParams = useSearchParams();
  const [tailors, setTailors] = useState<TailorRowWithBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const specialtyFromQuery = (searchParams.get("specialty") || "").trim();

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
          (tailor.brand?.name ?? "")
            .toLowerCase()
            .includes(normalizedSearchTerm) ||
          tailor.description?.toLowerCase().includes(normalizedSearchTerm)
        );
      });
  }, [tailors, selectedCategory, specialtyFromQuery, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="animate-pulse">
            <div className="mb-8 h-12 rounded-lg bg-oma-cocoa/10" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="mb-4 h-48 rounded-lg bg-oma-cocoa/10" />
                  <div className="mb-2 h-6 rounded bg-oma-cocoa/10" />
                  <div className="h-4 w-2/3 rounded bg-oma-cocoa/10" />
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
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="text-center">
            <h1 className="mb-4 font-canela text-3xl text-oma-cocoa">
              Something went wrong
            </h1>
            <p className="mb-8 text-oma-cocoa/70">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-oma-plum px-6 py-3 text-white transition-colors hover:bg-oma-plum/90"
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
      <div className="mx-auto max-w-7xl px-6 py-12">
        <FadeIn>
          <div className="mb-12 text-center">
            <h1 className="mb-4 font-canela text-5xl text-black">Our Designers</h1>
            <p className="mx-auto max-w-3xl text-xl text-oma-cocoa/80">
              Discover skilled artisans creating bespoke garments with precision
              and passion
            </p>
          </div>
        </FadeIn>

        <SlideUp delay={0.2}>
          <div className="mb-8">
            <div className="flex flex-col items-center justify-between gap-4 lg:flex-row">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transform text-black/40" />
                <input
                  type="text"
                  placeholder="Search tailors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-oma-cocoa/20 bg-white/80 py-3 pl-12 pr-4 text-black placeholder-black/50 focus:border-oma-plum/50 focus:outline-none"
                />
              </div>
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
              <div className="flex items-center gap-4">
                <div className="flex rounded-lg border border-oma-cocoa/20 bg-white/80 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`rounded-md p-2 transition-colors ${
                      viewMode === "grid"
                        ? "bg-oma-plum text-white"
                        : "text-black/60 hover:text-black"
                    }`}
                  >
                    <Grid className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`rounded-md p-2 transition-colors ${
                      viewMode === "list"
                        ? "bg-oma-plum text-white"
                        : "text-black/60 hover:text-black"
                    }`}
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </SlideUp>

        <AnimatePresence mode="wait">
          {viewMode === "grid" ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <StaggerContainer className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTailors.map((tailor, index) =>
                  tailor.brand ? (
                    <StaggerItem key={tailor.id} index={index}>
                      <motion.div
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="group flex h-full cursor-pointer flex-col overflow-hidden">
                          <div className="h-[500px] w-full overflow-hidden bg-gray-100">
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
                          <div className="flex flex-1 flex-col p-4">
                            <TailorDirectoryMeta tailor={tailor} />
                            <div className="mt-auto flex justify-end">
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
                        <Card className="group cursor-pointer overflow-hidden">
                          <div className="flex">
                            <div className="h-64 w-48 flex-shrink-0 overflow-hidden bg-gray-100">
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
                            <div className="flex flex-1 flex-col justify-between p-4">
                              <div>
                                <TailorDirectoryMeta tailor={tailor} />
                              </div>
                              <div className="mt-4 flex justify-end">
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
