"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCollectionById,
  getCollectionWithBrand,
} from "@/lib/services/collectionService";
import {
  getProductsByCollection,
  getIntelligentRecommendations,
} from "@/lib/services/productService";
import { Collection, Product, Brand } from "@/lib/supabase";
import { AuthImage } from "@/components/ui/auth-image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { NavigationLink } from "@/components/ui/navigation-link";
import {
  ArrowLeft,
  MapPin,
  CheckCircle,
  Star,
  ShoppingBag,
  Heart,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CollectionPage() {
  const params = useParams();
  const { user } = useAuth();
  const collectionId = params.id as string;

  const [collection, setCollection] = useState<
    (Collection & { brand: Brand; created_at?: string }) | undefined
  >();
  const [products, setProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCollectionData();
  }, [collectionId, user]);

  const fetchCollectionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch collection with brand data
      const collectionData = await getCollectionWithBrand(collectionId);
      if (!collectionData) {
        setError("Collection not found");
        return;
      }
      setCollection(collectionData);

      // Fetch products in this collection
      const productsData = await getProductsByCollection(collectionId);
      setProducts(productsData);

      // Fetch intelligent recommendations based on user favorites
      const recommendations = await getIntelligentRecommendations(
        collectionId,
        user?.id, // Pass user ID for personalized recommendations
        undefined, // No product to exclude since this is collection page
        4
      );

      // Shuffle recommendations for variety on each visit
      const shuffledRecommendations = recommendations.sort(
        () => Math.random() - 0.5
      );
      setRecommendedProducts(shuffledRecommendations);
    } catch (err) {
      console.error("Error fetching collection data:", err);
      setError("Failed to load collection information");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <h1 className="text-2xl font-canela text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <h1 className="text-2xl font-canela text-gray-900 mb-4">
            Collection Not Found
          </h1>
          <p className="text-gray-600">
            The collection you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <NavigationLink href="/collections" className="hover:text-oma-plum">
            Collections
          </NavigationLink>
          <span>/</span>
          <NavigationLink
            href={`/brand/${collection.brand.id}`}
            className="hover:text-oma-plum"
          >
            {collection.brand.name}
          </NavigationLink>
          <span>/</span>
          <span className="text-gray-900">{collection.title}</span>
        </div>

        {/* Collection Header */}
        <div className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Collection Image */}
            <div className="relative">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <AuthImage
                  src={collection.image}
                  alt={collection.title}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Collection Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-canela text-gray-900 mb-4">
                  {collection.title}
                </h1>
                <p className="text-lg text-gray-700 leading-relaxed">
                  {collection.description}
                </p>
              </div>

              {/* Brand Info */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  About the Designer
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {collection.brand.name}
                    </span>
                    {collection.brand.is_verified && (
                      <Badge
                        variant="secondary"
                        className="bg-oma-plum text-white text-xs"
                      >
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{collection.brand.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      Collection launched{" "}
                      {new Date(
                        collection.created_at || ""
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-canela text-gray-900 mb-8">
            Products in This Collection
          </h2>

          {products.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-lg text-gray-600">
                No products available in this collection yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <NavigationLink
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group block"
                >
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-gray-300">
                    <div className="aspect-square relative overflow-hidden bg-gray-100">
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
                            variant="destructive"
                            className="bg-red-500 text-white"
                          >
                            Sale
                          </Badge>
                        </div>
                      )}
                      {product.is_custom && (
                        <div className="absolute top-2 right-2">
                          <Badge
                            variant="secondary"
                            className="bg-blue-500 text-white"
                          >
                            Custom
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-oma-plum transition-colors mb-2">
                        {product.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
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
                          className={cn(
                            "text-xs",
                            product.in_stock
                              ? "bg-green-500 text-white"
                              : "bg-gray-400 text-white"
                          )}
                        >
                          {product.in_stock ? "In Stock" : "Out of Stock"}
                        </Badge>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {product.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </NavigationLink>
              ))}
            </div>
          )}
        </div>

        {/* You May Also Like Section */}
        {recommendedProducts.length > 0 && (
          <div className="border-t border-gray-200 pt-16">
            <div className="flex items-center gap-3 mb-8">
              <Heart className="h-6 w-6 text-oma-plum" />
              <h2 className="text-2xl font-canela text-gray-900">
                You May Also Like
              </h2>
              {user && (
                <span className="text-sm text-gray-600 ml-2">
                  Based on your favorites
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedProducts.map((product) => (
                <NavigationLink
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group block"
                >
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-gray-300">
                    <div className="aspect-square relative overflow-hidden bg-gray-100">
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
                            variant="destructive"
                            className="bg-red-500 text-white"
                          >
                            Sale
                          </Badge>
                        </div>
                      )}
                      {product.is_custom && (
                        <div className="absolute top-2 right-2">
                          <Badge
                            variant="secondary"
                            className="bg-blue-500 text-white"
                          >
                            Custom
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-oma-plum transition-colors mb-2">
                        {product.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
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
                          className={cn(
                            "text-xs",
                            product.in_stock
                              ? "bg-green-500 text-white"
                              : "bg-gray-400 text-white"
                          )}
                        >
                          {product.in_stock ? "In Stock" : "Out of Stock"}
                        </Badge>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {product.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </NavigationLink>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
