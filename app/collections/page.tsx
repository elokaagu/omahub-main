"use client";

import React, { useState, useEffect } from "react";
import { Search, Grid, List, Filter, X } from "lucide-react";
import { getCollectionsWithBrands } from "@/lib/services/collectionService";
import { getProductsWithBrandCurrency } from "@/lib/services/productService";
import { Catalogue, Brand, Product } from "@/lib/supabase";
import Link from "next/link";
import { LazyImage } from "@/components/ui/lazy-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { formatProductPrice } from "@/lib/utils/priceFormatter";
import { CategoryTag } from "@/components/ui/unified-tag";
import { getProductMainImage } from "@/lib/utils/productImageUtils";

type CatalogueWithBrand = Catalogue & {
  brand: {
    name: string;
    id: string;
    location: string;
    is_verified: boolean;
    category: string;
  };
};

type ProductWithBrand = Product & {
  brand: {
    name: string;
    id: string;
    location: string;
    is_verified: boolean;
    price_range?: string;
  };
};

// Smart focal point detection for fashion/catalogue images
const getImageFocalPoint = (imageUrl: string, title: string) => {
  // For fashion and catalogue images, we always want to focus on the upper portion
  // where faces, necklines, and key design elements are usually located
  // Using center-top positioning to ensure faces are visible and centered
  return "object-center object-top";
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
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [products, setProducts] = useState<ProductWithBrand[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithBrand[]>(
    []
  );
  const [productSearch, setProductSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedProductCategory, setSelectedProductCategory] = useState("all");
  const [productsLoading, setProductsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch catalogues and products
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const [catalogueData, productData] = await Promise.all([
          getCollectionsWithBrands().catch((err) => {
            console.error("Error fetching collections:", err);
            return [];
          }),
          getProductsWithBrandCurrency().catch((err) => {
            console.error("Error fetching products:", err);
            return [];
          }),
        ]);

        // Collections are already sorted by newest first from the service
        setCatalogues(catalogueData || []);
        setFilteredCatalogues(catalogueData || []);
        setProducts(productData || []);
        setFilteredProducts(productData || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load information");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Filter catalogues
  useEffect(() => {
    let filtered = catalogues;

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

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (catalogue) => catalogue.brand.category === selectedCategory
      );
    }

    setFilteredCatalogues(filtered);
  }, [catalogues, searchTerm, selectedCategory]);

  // Filter products
  useEffect(() => {
    let filtered = products;

    if (productSearch) {
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(productSearch.toLowerCase()) ||
          product.description
            ?.toLowerCase()
            .includes(productSearch.toLowerCase())
      );
    }

    if (selectedBrand !== "all") {
      filtered = filtered.filter(
        (product) => product.brand_id === selectedBrand
      );
    }

    if (selectedProductCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedProductCategory
      );
    }

    setFilteredProducts(filtered);
  }, [products, productSearch, selectedBrand, selectedProductCategory]);

  // Dynamic categories: all with at least 1 brand, sorted alphabetically, 'all' at top
  const uniqueCategories = Array.from(
    new Set(catalogues.map((c) => c.brand.category))
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  const categories = ["all", ...uniqueCategories];
  const brands = [
    "all",
    ...Array.from(new Set(catalogues.map((c) => c.brand.name))),
  ];
  const productCategories = [
    "all",
    ...Array.from(new Set(products.map((p) => p.category))),
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
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-canela text-black mb-6 text-left">
            {showAllProducts ? "All Products" : "Our Collections"}
          </h1>
          <p className="text-xl text-oma-cocoa/80 max-w-3xl text-left">
            {showAllProducts
              ? "Browse our complete collection of products"
              : "Explore curated collections from Africa's most talented designers"}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder={
                  showAllProducts ? "Search products..." : "Search brands..."
                }
                value={showAllProducts ? productSearch : searchTerm}
                onChange={(e) =>
                  showAllProducts
                    ? setProductSearch(e.target.value)
                    : setSearchTerm(e.target.value)
                }
                className="w-full"
              />
            </div>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
                className="flex items-center gap-2"
              >
                {viewMode === "grid" ? (
                  <List className="h-4 w-4" />
                ) : (
                  <Grid className="h-4 w-4" />
                )}
                {viewMode === "grid" ? "List View" : "Grid View"}
              </Button>
              <Button
                onClick={() => setShowAllProducts(!showAllProducts)}
                className="bg-oma-plum text-white hover:bg-oma-plum/90"
              >
                {showAllProducts ? "View Brands" : "View All Products"}
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {showAllProducts ? (
                  <>
                    <Select
                      value={selectedBrand}
                      onValueChange={setSelectedBrand}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand} value={brand}>
                            {brand === "all" ? "All Brands" : brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={selectedProductCategory}
                      onValueChange={setSelectedProductCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {productCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category === "all" ? "All Categories" : category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category === "all" ? "All Categories" : category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {showAllProducts ? (
          // Products Grid/List
          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-3 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
            }`}
          >
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                  viewMode === "list" ? "flex" : ""
                }`}
              >
                <Link
                  href={`/product/${product.id}`}
                  className={viewMode === "list" ? "flex w-full" : ""}
                >
                  <div
                    className={`relative ${viewMode === "list" ? "w-1/3 aspect-square" : "aspect-square"}`}
                  >
                    <LazyImage
                      src={getProductMainImage(product) || "/placeholder.png"}
                      alt={product.title}
                      fill
                      className="object-cover"
                      aspectRatio="square"
                      quality={80}
                      sizes={
                        viewMode === "list"
                          ? "(max-width: 1024px) 33vw, 25vw"
                          : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      }
                    />
                  </div>
                  <div className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                    <h3 className="font-medium text-lg mb-1">
                      {product.title}
                    </h3>
                    <p className="text-oma-cocoa/70 text-sm mb-2">
                      {(() => {
                        try {
                          const catalogue = catalogues.find(
                            (c) => c.brand_id === product.brand_id
                          );
                          return (
                            catalogue?.brand?.name ||
                            product.brand?.name ||
                            "Unknown Brand"
                          );
                        } catch (error) {
                          console.error("Error getting brand name:", error);
                          return "Unknown Brand";
                        }
                      })()}
                    </p>
                    <p className="text-oma-plum font-medium">
                      {(() => {
                        try {
                          if (product.service_type === "portfolio") {
                            return "";
                          }
                          return formatProductPrice(product, product.brand)
                            .displayPrice;
                        } catch (error) {
                          console.error("Error formatting price:", error, {
                            product,
                            brand: product.brand,
                          });
                          return "Contact for pricing";
                        }
                      })()}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          // Collections Grid/List - Full image coverage with text overlay
          <div
            className={`grid gap-4 sm:gap-6 ${
              viewMode === "grid"
                ? "grid-cols-3 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
            }`}
          >
            {filteredCatalogues.map((catalogue) => (
              <div
                key={catalogue.id}
                className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group ${
                  viewMode === "list" ? "flex" : ""
                }`}
              >
                <Link
                  href={`/collection/${catalogue.id}`}
                  className={viewMode === "list" ? "flex w-full" : ""}
                >
                  <div
                    className={`relative overflow-hidden ${
                      viewMode === "list"
                        ? "w-1/2 aspect-[4/3]"
                        : "aspect-[3/4]"
                    }`}
                  >
                    <LazyImage
                      src={catalogue.image || "/placeholder-image.jpg"}
                      alt={catalogue.title}
                      fill
                      className={`object-cover ${getImageFocalPoint(catalogue.image, catalogue.title)} group-hover:scale-105 transition-transform duration-300`}
                      sizes={
                        viewMode === "list"
                          ? "(max-width: 1024px) 50vw, 33vw"
                          : "(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw"
                      }
                      priority={false}
                      aspectRatio={viewMode === "list" ? "4/3" : "3/4"}
                      quality={80}
                    />
                    {/* Text overlay at bottom - restored for elegant styling */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                      <h3 className="font-medium text-lg mb-1 text-white">
                        {catalogue.title}
                      </h3>
                      <p className="text-white/90 text-sm mb-2">
                        {catalogue.brand.name}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/80">
                          {catalogue.brand.location}
                        </span>
                        {catalogue.brand.is_verified && (
                          <Badge
                            variant="secondary"
                            className="bg-white/20 text-white border-white/30 text-xs"
                          >
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Grid view caption text below image - only for list view now */}
                  {viewMode === "list" && (
                    <div className="flex-1 p-4 flex flex-col justify-center">
                      <h3 className="font-medium text-xl mb-2 text-black">
                        {catalogue.title}
                      </h3>
                      <p className="text-oma-cocoa/70 text-base mb-3">
                        {catalogue.brand.name}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-oma-cocoa/60">
                          {catalogue.brand.location}
                        </span>
                        {catalogue.brand.is_verified && (
                          <Badge
                            variant="secondary"
                            className="bg-oma-gold/20 text-oma-cocoa border-oma-gold/30 text-xs"
                          >
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
