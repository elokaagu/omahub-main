"use client";

import { useState, useEffect } from "react";
import { Search, Grid, List, Filter, X } from "lucide-react";
import { getCataloguesWithBrands } from "@/lib/services/catalogueService";
import { getAllProducts } from "@/lib/services/productService";
import { Catalogue, Brand, Product } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FavouriteButton } from "@/components/ui/favorite-button";

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
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
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
          getCataloguesWithBrands(),
          getAllProducts(),
        ]);
        setCatalogues(catalogueData);
        setFilteredCatalogues(catalogueData);
        setProducts(productData);
        setFilteredProducts(productData);
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
          product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
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

  const categories = [
    "all",
    ...Array.from(new Set(catalogues.map((c) => c.brand.category))),
  ];
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
      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-canela text-black mb-6">
            {showAllProducts ? "All Products" : "Our Catalogues"}
          </h1>
          <p className="text-xl text-oma-cocoa/80 max-w-3xl mx-auto">
            {showAllProducts
              ? "Browse our complete collection of products"
              : "Explore curated catalogues from Africa's most talented designers"}
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
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <Link href={`/product/${product.id}`}>
                  <div className="relative aspect-square">
                    <Image
                      src={product.image || "/placeholder.png"}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-lg mb-1">
                      {product.title}
                    </h3>
                    <p className="text-oma-cocoa/70 text-sm mb-2">
                      {
                        catalogues.find((c) => c.brand_id === product.brand_id)
                          ?.brand.name
                      }
                    </p>
                    <p className="text-oma-plum font-medium">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          // Brands Grid/List
          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {filteredCatalogues.map((catalogue) => (
              <div
                key={catalogue.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <Link href={`/catalogue/${catalogue.id}`}>
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={catalogue.image || "/placeholder.png"}
                      alt={catalogue.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-lg mb-1">
                      {catalogue.brand.name}
                    </h3>
                    <p className="text-oma-cocoa/70 text-sm mb-2">
                      {catalogue.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-oma-cocoa/70">
                        {catalogue.brand.location}
                      </span>
                      <FavouriteButton
                        itemId={catalogue.id}
                        itemType="catalogue"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowAllProducts(true);
                          setSelectedBrand(catalogue.brand.name);
                        }}
                      >
                        View Products
                      </Button>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
