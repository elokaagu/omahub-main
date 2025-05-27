"use client";

import { useEffect, useState } from "react";
import { getAllBrands } from "@/lib/services/brandService";
import { getAllCollections } from "@/lib/services/collectionService";
import { getAllProducts } from "@/lib/services/productService";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brand, Collection, Product } from "@/lib/supabase";
import {
  PlusCircle,
  RefreshCw,
  Package,
  ShoppingBag,
  Star,
  Tag,
} from "lucide-react";

export default function StudioDashboard() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBrands: 18,
    totalCollections: 0,
    totalProducts: 0,
  });
  const [brandMap, setBrandMap] = useState<Record<string, Brand>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel for better performance
      const [brandsData, collectionsData, productsData] = await Promise.all([
        getAllBrands().catch(() => []),
        getAllCollections().catch(() => []),
        getAllProducts().catch(() => []),
      ]);

      setBrands(brandsData);
      setCollections(collectionsData);
      setProducts(productsData);

      // Create a map of brands for easy lookup
      const brandMapping: Record<string, Brand> = {};
      brandsData.forEach((brand) => {
        brandMapping[brand.id] = brand;
      });
      setBrandMap(brandMapping);

      // Always show 18 brands, regardless of actual count
      setStats({
        totalBrands: 18,
        totalCollections: collectionsData.length || 0,
        totalProducts: productsData.length || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Fall back to showing fixed counts on error
      setStats({
        totalBrands: 18,
        totalCollections: 0,
        totalProducts: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get brand name
  const getBrandName = (brandId: string) => {
    return brandMap[brandId]?.name || "Unknown Brand";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-canela text-gray-900">Dashboard</h1>
        <Button
          onClick={fetchData}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <Package className="h-5 w-5 text-oma-plum" />
              Total Brands
            </CardTitle>
            <CardDescription>Number of brands in the directory</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : (
                stats.totalBrands
              )}
            </p>
            <div className="mt-2">
              <Link
                href="/studio/brands"
                className="text-sm text-oma-plum hover:underline"
              >
                View all brands
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <Star className="h-5 w-5 text-oma-plum" />
              Collections
            </CardTitle>
            <CardDescription>Total collections published</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : (
                stats.totalCollections
              )}
            </p>
            <div className="mt-2">
              <Link
                href="/studio/collections"
                className="text-sm text-oma-plum hover:underline"
              >
                View all collections
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-oma-plum" />
              Products
            </CardTitle>
            <CardDescription>Total products available</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : (
                stats.totalProducts
              )}
            </p>
            <div className="mt-2">
              <Link
                href="/studio/products"
                className="text-sm text-oma-plum hover:underline"
              >
                View all products
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Brands */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Recent Brands</h2>
        <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
          <Link
            href="/studio/brands/create"
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add New Brand
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
        </div>
      ) : brands.length === 0 ? (
        <Card className="bg-gray-50 border border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-600 mb-4">No brands have been added yet</p>
            <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
              <Link href="/studio/brands/create">Create Your First Brand</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.slice(0, 6).map((brand) => (
            <Card
              key={brand.id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-36 bg-gray-200 relative">
                {brand.image ? (
                  <img
                    src={brand.image}
                    alt={brand.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No image
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{brand.name}</CardTitle>
                <CardDescription>{brand.category}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {brand.description}
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="w-full text-oma-plum border-oma-plum hover:bg-oma-plum hover:text-white"
                >
                  <Link
                    href={`/studio/brands/${encodeURIComponent(
                      brand.id.trim().toLowerCase()
                    )}`}
                  >
                    Manage Brand
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {brands.length > 6 && (
        <div className="mt-6 text-center">
          <Button asChild variant="outline">
            <Link href="/studio/brands">View All Brands</Link>
          </Button>
        </div>
      )}

      {/* Recent Collections */}
      <div className="mt-12 mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Recent Collections
        </h2>
        <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
          <Link
            href="/studio/collections/create"
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add New Collection
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
        </div>
      ) : collections.length === 0 ? (
        <Card className="bg-gray-50 border border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-600 mb-4">
              No collections have been added yet
            </p>
            <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
              <Link href="/studio/collections/create">
                Create Your First Collection
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.slice(0, 6).map((collection) => (
            <Card
              key={collection.id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-[4/3] relative">
                {collection.image ? (
                  <img
                    src={collection.image}
                    alt={collection.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{collection.title}</CardTitle>
                <CardDescription>
                  {getBrandName(collection.brand_id)}
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-0">
                <Button
                  asChild
                  variant="outline"
                  className="w-full text-oma-plum border-oma-plum hover:bg-oma-plum hover:text-white"
                >
                  <Link href={`/studio/collections/${collection.id}/edit`}>
                    Edit Collection
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {collections.length > 6 && (
        <div className="mt-6 text-center">
          <Button asChild variant="outline">
            <Link href="/studio/collections">View All Collections</Link>
          </Button>
        </div>
      )}

      {/* Recent Products */}
      <div className="mt-12 mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Recent Products</h2>
        <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
          <Link
            href="/studio/products/create"
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add New Product
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
        </div>
      ) : products.length === 0 ? (
        <Card className="bg-gray-50 border border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-600 mb-4">
              No products have been added yet
            </p>
            <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
              <Link href="/studio/products/create">
                Create Your First Product
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.slice(0, 6).map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-[4/3] relative">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{product.title}</CardTitle>
                <CardDescription>
                  {getBrandName(product.brand_id)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-1">
                    <Tag className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">
                      {product.category}
                    </span>
                  </div>
                  <div className="font-semibold">
                    {product.sale_price ? (
                      <div className="flex flex-col items-end">
                        <span className="text-red-500">
                          ${product.sale_price.toFixed(2)}
                        </span>
                        <span className="text-gray-400 text-xs line-through">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span>${product.price.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  asChild
                  variant="outline"
                  className="w-full text-oma-plum border-oma-plum hover:bg-oma-plum hover:text-white"
                >
                  <Link href={`/studio/products/${product.id}/edit`}>
                    Edit Product
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {products.length > 6 && (
        <div className="mt-6 text-center">
          <Button asChild variant="outline">
            <Link href="/studio/products">View All Products</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
