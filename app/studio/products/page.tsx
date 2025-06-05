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
  deleteProduct,
} from "@/lib/services/productService";
import { Product, Brand, Collection } from "@/lib/supabase";
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

type ProductWithDetails = Product & {
  brand: { name: string; id: string; location: string; is_verified: boolean };
  collection?: { title: string; id: string };
};

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

  // Check if user is super admin
  useEffect(() => {
    if (user && user.role !== "super_admin") {
      router.push("/studio");
      return;
    }
  }, [user, router]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsData = await getProductsWithDetails();
        setProducts(productsData);
        setFilteredProducts(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "super_admin") {
      fetchProducts();
    }
  }, [user]);

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
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      setIsDeleting(productId);
      await deleteProduct(productId);
      setProducts((prev) => prev.filter((product) => product.id !== productId));
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    } finally {
      setIsDeleting(null);
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

  if (user?.role !== "super_admin") {
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
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-canela text-gray-900 mb-2">Products</h1>
          <p className="text-gray-600">
            Manage all products across the platform. Create, edit, and organize
            products from all brands and collections.
          </p>
        </div>
        <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
          <NavigationLink href="/studio/products/create">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </NavigationLink>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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
              Avg. Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-canela text-oma-plum">
              $
              {products.length > 0
                ? Math.round(
                    products.reduce(
                      (sum, p) => sum + (p.sale_price || p.price),
                      0
                    ) / products.length
                  )
                : 0}
            </div>
            <p className="text-xs text-oma-cocoa mt-2">Average product price</p>
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
        <div className="mb-6 flex flex-wrap gap-2">
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-oma-plum/10 text-oma-plum rounded-full text-sm">
              Search: "{searchQuery}"
              <button
                onClick={() => setSearchQuery("")}
                className="hover:bg-oma-plum/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {categoryFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-oma-plum/10 text-oma-plum rounded-full text-sm">
              Category: {categoryFilter}
              <button
                onClick={() => setCategoryFilter("all")}
                className="hover:bg-oma-plum/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {stockFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-oma-plum/10 text-oma-plum rounded-full text-sm">
              Stock: {stockFilter === "in_stock" ? "In Stock" : "Out of Stock"}
              <button
                onClick={() => setStockFilter("all")}
                className="hover:bg-oma-plum/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {brandFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-oma-plum/10 text-oma-plum rounded-full text-sm">
              Brand: {brands.find((b) => b.id === brandFilter)?.name}
              <button
                onClick={() => setBrandFilter("all")}
                className="hover:bg-oma-plum/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
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
                      ${product.sale_price || product.price}
                    </span>
                    {product.sale_price && (
                      <span className="text-sm text-oma-cocoa/60 line-through">
                        ${product.price}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={product.in_stock ? "default" : "secondary"}
                      className={cn(
                        "text-xs",
                        product.in_stock
                          ? "bg-oma-gold text-oma-cocoa"
                          : "bg-oma-cocoa/40 text-white"
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
                            ${product.sale_price || product.price}
                          </span>
                          {product.sale_price && (
                            <span className="text-sm text-oma-cocoa/60 line-through">
                              ${product.price}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={product.in_stock ? "default" : "secondary"}
                            className={cn(
                              "text-xs",
                              product.in_stock
                                ? "bg-oma-gold text-oma-cocoa"
                                : "bg-oma-cocoa/40 text-white"
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
    </div>
  );
}
