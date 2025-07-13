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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loading } from "@/components/ui/loading";
import { useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();
  const [tailors, setTailors] = useState<TailorWithBrand[]>([]);
  const [filteredTailors, setFilteredTailors] = useState<TailorWithBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
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

    // Filter by specialty query param
    const specialty = searchParams.get("specialty");
    if (specialty) {
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
        return specialtiesArr.some(
          (s) => s.toLowerCase() === specialty.toLowerCase()
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
  }, [tailors, searchTerm, searchParams]);

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
            Our Designers
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
        </div>

        {/* Tailors Grid/List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTailors.map((tailor) =>
            tailor.brand ? (
              <Card key={tailor.id} className="overflow-hidden">
                <CardHeader className="p-6 pb-4">
                  <CardTitle className="text-2xl font-canela text-oma-cocoa">
                    {tailor.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <p className="text-oma-cocoa/70 text-lg">
                      {tailor.brand.name}
                    </p>
                    {tailor.brand.is_verified && (
                      <Badge className="bg-oma-gold text-black font-semibold px-2 py-1 text-xs uppercase ml-2">
                        Verified
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-oma-cocoa/60" />
                    <span className="text-oma-cocoa/70 text-sm">
                      {tailor.created_at}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-5 h-5 text-oma-cocoa/60" />
                    {tailor.price_range && (
                      <span className="text-oma-cocoa/70 text-sm">
                        {tailor.price_range}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Scissors className="w-5 h-5 text-oma-cocoa/60" />
                    <span className="text-oma-cocoa/70 text-sm">
                      {tailor.brand.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-oma-cocoa/60" />
                    <span className="text-oma-cocoa/70 text-sm">
                      {tailor.brand.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <OptimizedImage
                      src={tailor.image}
                      alt={tailor.title}
                      className={`w-full h-48 object-cover rounded-lg ${getImageFocalPoint(
                        tailor.image,
                        tailor.title
                      )}`}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Link href={`/tailors/${tailor.id}`}>
                      <Button className="bg-oma-plum text-white hover:bg-oma-plum/90 transition-colors">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}
