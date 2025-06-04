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
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-canela text-oma-plum mb-2">Products</h1>
          <p className="text-oma-cocoa/70">
            Manage all products across the platform
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-oma-cocoa/70">
                  Total Products
                </p>
                <p className="text-2xl font-bold text-oma-cocoa">
                  {products.length}
                </p>
              </div>
              <Package className="h-8 w-8 text-oma-plum" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-oma-cocoa/70">
                  In Stock
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {products.filter((p) => p.in_stock).length}
                </p>
              </div>
              <ShoppingBag className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-oma-cocoa/70">
                  Out of Stock
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {products.filter((p) => !p.in_stock).length}
                </p>
              </div>
              <Package className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-oma-cocoa/70">
                  Avg. Price
                </p>
                <p className="text-2xl font-bold text-oma-cocoa">
                  $
                  {products.length > 0
                    ? Math.round(
                        products.reduce(
                          (sum, p) => sum + (p.sale_price || p.price),
                          0
                        ) / products.length
                      )
                    : 0}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-oma-plum" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products, brands, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
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

                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Brand" />
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

            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-sm text-oma-cocoa/70">
          Showing {filteredProducts.length} of {products.length} products
        </p>
      </div>

      {/* Products Grid/List */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-500 mb-4">
              {products.length === 0
                ? "No products have been created yet."
                : "Try adjusting your search or filters."}
            </p>
            {products.length === 0 && (
              <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
                <NavigationLink href="/studio/products/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Product
                </NavigationLink>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="group hover:shadow-lg transition-shadow"
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
                    <Badge variant="destructive" className="bg-red-600">
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
                  <h3 className="font-semibold text-gray-900 line-clamp-1">
                    {product.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{product.brand.name}</span>
                    {product.brand.is_verified && (
                      <Badge variant="secondary" className="text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-oma-plum">
                      ${product.sale_price || product.price}
                    </span>
                    {product.sale_price && (
                      <span className="text-sm text-gray-500 line-through">
                        ${product.price}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={product.in_stock ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {product.in_stock ? "In Stock" : "Out of Stock"}
                    </Badge>
                    <span className="text-xs text-gray-500">
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
              className="hover:shadow-md transition-shadow"
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
                        <h3 className="font-semibold text-gray-900">
                          {product.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{product.brand.name}</span>
                          {product.brand.is_verified && (
                            <Badge variant="secondary" className="text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Category: {product.category}</span>
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
                            <span className="text-sm text-gray-500 line-through">
                              ${product.price}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={product.in_stock ? "default" : "secondary"}
                            className="text-xs"
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
                              variant="destructive"
                              className="bg-red-600 text-xs"
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
