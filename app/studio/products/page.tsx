"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { AuthImage } from "@/components/ui/auth-image";
import { NavigationLink } from "@/components/ui/navigation-link";
import {
  getAllProducts,
  getProductsWithDetails,
  getProductsWithBrandCurrency,
  deleteProduct,
} from "@/lib/services/productService";
import { Product, Brand, Catalogue } from "@/lib/supabase";
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Grid,
  List,
  DollarSign,
  ShoppingBag,
  Star,
  MapPin,
  Calendar,
  LayoutGrid,
  LayoutList,
  X,
  Heart,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { formatProductPrice } from "@/lib/utils/priceFormatter";
import { ActiveFilters } from "@/components/ui/unified-tag";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type ProductWithDetails = Product & {
  brand: {
    name: string;
    id: string;
    location: string;
    is_verified: boolean;
    price_range?: string;
  };
  collection?: { title: string; id: string };
};

interface ProductFavourites {
  productId: string;
  count: number;
  productTitle?: string;
}

export default function ProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<
    ProductWithDetails[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [favouritesData, setFavouritesData] = useState<{
    totalFavourites: number;
    mostPopular: ProductFavourites | null;
  }>({
    totalFavourites: 0,
    mostPopular: null,
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Check if user is super admin or brand owner
  // useEffect(() => {
  //   if (user && user.role !== "super_admin" && user.role !== "brand_admin") {
  //     router.push("/studio");
  //     return;
  //   }
  // }, [user, router]);

  // Fetch favourites data
  const fetchFavouritesData = async () => {
    try {
      if (!supabase) return;

      // Get total favourites count for products
      const { data: totalFavouritesData, error: totalError } = await supabase
        .from("favourites")
        .select("id")
        .eq("item_type", "product");

      if (totalError) {
        console.error("Error fetching total favourites:", totalError);
        return;
      }

      // Get favourites count per product
      const { data: favouritesCountData, error: countError } = await supabase
        .from("favourites")
        .select("item_id")
        .eq("item_type", "product");

      if (countError) {
        console.error("Error fetching favourites count:", countError);
        return;
      }

      // Count favourites per product
      const productFavouritesMap = favouritesCountData.reduce(
        (acc, fav) => {
          acc[fav.item_id] = (acc[fav.item_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Find most popular product
      let mostPopular: ProductFavourites | null = null;
      let maxCount = 0;

      Object.entries(productFavouritesMap).forEach(([productId, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostPopular = { productId, count } as ProductFavourites;
        }
      });

      // Add product title to most popular
      if (mostPopular && products.length > 0) {
        const product = products.find((p) => p.id === mostPopular!.productId);
        if (product) {
          mostPopular = {
            productId: mostPopular.productId,
            count: mostPopular.count,
            productTitle: product.title,
          } as ProductFavourites;
        }
      }

      setFavouritesData({
        totalFavourites: totalFavouritesData.length,
        mostPopular,
      });
    } catch (error) {
      console.error("Error fetching favourites data:", error);
    }
  };

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsData = await getProductsWithBrandCurrency();

        // Filter products based on user role
        if (user?.role === "super_admin") {
          // Super admins see all products
          setProducts(productsData);
          setFilteredProducts(productsData);
        } else if (user?.role === "brand_admin") {
          // Brand owners see only products from their owned brands
          if (!supabase) {
            console.error("Supabase client not available");
            setProducts([]);
            setFilteredProducts([]);
            return;
          }

          const userProfile = await supabase
            .from("profiles")
            .select("owned_brands")
            .eq("id", user.id)
            .single();

          if (userProfile.data?.owned_brands) {
            const ownedBrandIds = userProfile.data.owned_brands;
            const ownedProducts = productsData.filter((product) =>
              ownedBrandIds.includes(product.brand_id)
            );
            setProducts(ownedProducts);
            setFilteredProducts(ownedProducts);
          } else {
            setProducts([]);
            setFilteredProducts([]);
          }
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "super_admin" || user?.role === "brand_admin") {
      fetchProducts();
    }
  }, [user]);

  // Fetch favourites data when products are loaded
  useEffect(() => {
    if (products.length > 0) {
      fetchFavouritesData();
    }
  }, [products]);

  // Filter products based on search and filters
  useEffect(() => {
    let filtered = products;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          product.brand.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (product) => product.category === categoryFilter
      );
    }

    // Stock filter
    if (stockFilter !== "all") {
      filtered = filtered.filter((product) =>
        stockFilter === "in_stock" ? product.in_stock : !product.in_stock
      );
    }

    // Brand filter
    if (brandFilter !== "all") {
      filtered = filtered.filter((product) => product.brand_id === brandFilter);
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, categoryFilter, stockFilter, brandFilter]);

  const handleDeleteProduct = async (productId: string) => {
    setProductToDelete(productId);
    setDeleteModalOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(productToDelete);
      await deleteProduct(productToDelete);
      setProducts((prev) =>
        prev.filter((product) => product.id !== productToDelete)
      );
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    } finally {
      setIsDeleting(null);
      setDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setStockFilter("all");
    setBrandFilter("all");
  };

  const hasActiveFilters =
    searchQuery ||
    categoryFilter !== "all" ||
    stockFilter !== "all" ||
    brandFilter !== "all";

  // Get unique categories and brands for filters
  const categories = Array.from(
    new Set(products.map((p) => p.category))
  ).sort();
  const brands = Array.from(
    new Set(products.map((p) => ({ id: p.brand_id, name: p.brand.name })))
  ).sort((a, b) => a.name.localeCompare(b.name));

  if (user?.role !== "super_admin" && user?.role !== "brand_admin") {
    return <Loading />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-12 gap-4">
        <div>
          <h1 className="text-3xl font-canela text-gray-900 mb-2">Products</h1>
          <p className="text-oma-cocoa/80 mb-8">
            Manage all products across the platform. Create, edit, and organise
            your product collection with ease.
          </p>
        </div>
        <Button
          asChild
          className="bg-oma-plum hover:bg-oma-plum/90 w-full sm:w-auto"
        >
          <NavigationLink href="/studio/products/create">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </NavigationLink>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
        <Card className="border-l-4 border-l-oma-plum border-oma-beige">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-oma-cocoa">
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-canela text-oma-plum">
              {products.length}
            </div>
            <p className="text-xs text-oma-cocoa mt-2">
              Products across all brands
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 border-oma-beige">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-oma-cocoa">
              In Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-canela text-oma-plum">
              {products.filter((p) => p.in_stock).length}
            </div>
            <p className="text-xs text-oma-cocoa mt-2">
              Available for purchase
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 border-oma-beige">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-oma-cocoa">
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-canela text-oma-plum">
              {products.filter((p) => !p.in_stock).length}
            </div>
            <p className="text-xs text-oma-cocoa mt-2">Currently unavailable</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-oma-cocoa border-oma-beige">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-oma-cocoa">
              Total Favourites
            </CardTitle>
            <Heart className="h-4 w-4 text-oma-cocoa" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-canela text-oma-plum">
              {favouritesData.totalFavourites}
            </div>
            <p className="text-xs text-oma-cocoa mt-2">
              Products favourited by users
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-oma-gold border-oma-beige">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-oma-cocoa">
              Most Popular
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-oma-cocoa" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-canela text-oma-plum">
              {favouritesData.mostPopular?.count || 0}
            </div>
            <p className="text-xs text-oma-cocoa mt-2">
              {favouritesData.mostPopular?.productTitle
                ? `${
                    favouritesData.mostPopular.productTitle.length > 20
                      ? favouritesData.mostPopular.productTitle.substring(
                          0,
                          20
                        ) + "..."
                      : favouritesData.mostPopular.productTitle
                  } favourites`
                : "No favourites yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-oma-cocoa/60" />
            <Input
              type="search"
              placeholder="Search products, brands, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-oma-cocoa/20 focus:border-oma-plum/50"
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
                  ? "bg-oma-beige text-oma-plum"
                  : "text-oma-cocoa"
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
                  ? "bg-oma-beige text-oma-plum"
                  : "text-oma-cocoa"
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
                      categoryFilter !== "all",
                      stockFilter !== "all",
                      brandFilter !== "all",
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
              Show All Products
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-6 rounded-lg bg-oma-beige/50 border border-oma-gold/10">
            <div>
              <label className="text-sm font-medium text-oma-cocoa mb-2 block">
                Category
              </label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="border-oma-cocoa/20 focus:border-oma-plum">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-oma-cocoa mb-2 block">
                Stock Status
              </label>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="border-oma-cocoa/20 focus:border-oma-plum">
                  <SelectValue placeholder="All Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-oma-cocoa mb-2 block">
                Brand
              </label>
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="border-oma-cocoa/20 focus:border-oma-plum">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mb-6">
          <ActiveFilters
            filters={[
              ...(searchQuery
                ? [
                    {
                      type: "search" as const,
                      value: searchQuery,
                      label: `Search: "${searchQuery}"`,
                    },
                  ]
                : []),
              ...(categoryFilter !== "all"
                ? [
                    {
                      type: "category" as const,
                      value: categoryFilter,
                      label: `Category: ${categoryFilter}`,
                    },
                  ]
                : []),
              ...(stockFilter !== "all"
                ? [
                    {
                      type: "stock" as const,
                      value: stockFilter,
                      label: `Stock: ${stockFilter === "in_stock" ? "In Stock" : "Out of Stock"}`,
                    },
                  ]
                : []),
              ...(brandFilter !== "all"
                ? [
                    {
                      type: "brand" as const,
                      value: brandFilter,
                      label: `Brand: ${brands.find((b) => b.id === brandFilter)?.name || brandFilter}`,
                    },
                  ]
                : []),
            ]}
            onRemove={(type, value) => {
              switch (type) {
                case "search":
                  setSearchQuery("");
                  break;
                case "category":
                  setCategoryFilter("all");
                  break;
                case "stock":
                  setStockFilter("all");
                  break;
                case "brand":
                  setBrandFilter("all");
                  break;
              }
            }}
          />
        </div>
      )}

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-oma-cocoa">
          Showing {filteredProducts.length} of {products.length} products
        </p>
      </div>

      {/* Products Grid/List */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-oma-beige/30 rounded-lg border border-oma-gold/10">
          <div className="text-oma-cocoa/40 mb-4">
            <Package className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-oma-cocoa mb-2">
            No products found
          </h3>
          <p className="text-oma-cocoa/70 mb-4">
            {products.length === 0
              ? "No products have been created yet."
              : "Try adjusting your search or filters."}
          </p>
          {products.length === 0 ? (
            <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
              <NavigationLink href="/studio/products/create">
                <Plus className="h-4 w-4 mr-2" />
                Create First Product
              </NavigationLink>
            </Button>
          ) : (
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
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="group hover:shadow-lg transition-all duration-200 border border-oma-gold/10 hover:border-oma-plum/20 bg-white"
            >
              <div className="aspect-square relative overflow-hidden rounded-t-lg">
                <AuthImage
                  src={product.image}
                  alt={product.title}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.sale_price && (
                  <div className="absolute top-2 left-2">
                    <Badge
                      variant="secondary"
                      className="bg-oma-plum text-white"
                    >
                      Sale
                    </Badge>
                  </div>
                )}
                {product.is_custom && (
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant="secondary"
                      className="bg-oma-plum text-white"
                    >
                      Custom
                    </Badge>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" asChild>
                      <NavigationLink href={`/product/${product.id}`}>
                        <Eye className="h-4 w-4" />
                      </NavigationLink>
                    </Button>
                    <Button size="sm" variant="secondary" asChild>
                      <NavigationLink
                        href={`/studio/products/${product.id}/edit`}
                      >
                        <Edit className="h-4 w-4" />
                      </NavigationLink>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteProduct(product.id)}
                      disabled={isDeleting === product.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-oma-cocoa line-clamp-1 group-hover:text-oma-plum transition-colors">
                    {product.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-oma-cocoa/70">
                    <span>{product.brand.name}</span>
                    {product.brand.is_verified && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-oma-plum text-white"
                      >
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-oma-plum">
                      {formatProductPrice(product, product.brand).displayPrice}
                    </span>
                    {product.sale_price && (
                      <span className="text-sm text-oma-cocoa/60 line-through">
                        {
                          formatProductPrice(product, product.brand)
                            .originalPrice
                        }
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        product.in_stock
                          ? "bg-oma-gold text-oma-cocoa hover:bg-oma-gold/90 hover:text-oma-cocoa"
                          : "bg-oma-cocoa/40 text-white hover:bg-oma-cocoa/50"
                      )}
                    >
                      {product.in_stock ? "In Stock" : "Out of Stock"}
                    </Badge>
                    <span className="text-xs text-oma-cocoa/60 px-2 py-1 bg-oma-beige/50 rounded">
                      {product.category}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="hover:shadow-md transition-all duration-200 border border-oma-gold/10 hover:border-oma-plum/20 bg-white"
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0">
                    <AuthImage
                      src={product.image}
                      alt={product.title}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-oma-cocoa">
                          {product.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-oma-cocoa/70">
                          <span>{product.brand.name}</span>
                          {product.brand.is_verified && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-oma-plum text-white"
                            >
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-oma-cocoa/70 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-oma-cocoa/60">
                          <span className="px-2 py-1 bg-oma-beige/50 rounded">
                            {product.category}
                          </span>
                          {product.collection && (
                            <span>Collection: {product.collection.title}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-oma-plum">
                            {
                              formatProductPrice(product, product.brand)
                                .displayPrice
                            }
                          </span>
                          {product.sale_price && (
                            <span className="text-sm text-oma-cocoa/60 line-through">
                              {
                                formatProductPrice(product, product.brand)
                                  .originalPrice
                              }
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs",
                              product.in_stock
                                ? "bg-oma-gold text-oma-cocoa hover:bg-oma-gold/90 hover:text-oma-cocoa"
                                : "bg-oma-cocoa/40 text-white hover:bg-oma-cocoa/50"
                            )}
                          >
                            {product.in_stock ? "In Stock" : "Out of Stock"}
                          </Badge>
                          {product.is_custom && (
                            <Badge
                              variant="secondary"
                              className="bg-oma-plum text-white text-xs"
                            >
                              Custom
                            </Badge>
                          )}
                          {product.sale_price && (
                            <Badge
                              variant="secondary"
                              className="bg-oma-plum text-white text-xs"
                            >
                              Sale
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <NavigationLink href={`/product/${product.id}`}>
                              <Eye className="h-4 w-4" />
                            </NavigationLink>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <NavigationLink
                              href={`/studio/products/${product.id}/edit`}
                            >
                              <Edit className="h-4 w-4" />
                            </NavigationLink>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={isDeleting === product.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteProduct}
              disabled={isDeleting === productToDelete}
            >
              {isDeleting === productToDelete ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
