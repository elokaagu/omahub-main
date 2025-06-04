"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getCollectionById } from "@/lib/services/collectionService";
import { getProductsByCollection } from "@/lib/services/productService";
import { getBrandById } from "@/lib/services/brandService";
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
} from "lucide-react";

export default function CollectionPage() {
  const params = useParams();
  const collectionId = params.id as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCollectionData();
  }, [collectionId]);

  const fetchCollectionData = async () => {
    try {
      setLoading(true);
      setError(null);

      const collectionData = await getCollectionById(collectionId);
      if (!collectionData) {
        setError("Collection not found");
        return;
      }

      const [productsData, brandData] = await Promise.all([
        getProductsByCollection(collectionId),
        getBrandById(collectionData.brand_id),
      ]);

      setCollection(collectionData);
      setProducts(productsData);
      setBrand(brandData);
    } catch (err) {
      console.error("Error fetching collection data:", err);
      setError("Failed to load collection information");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 sm:px-6 py-16">
          <div className="flex justify-center items-center h-64">
            <Loading />
          </div>
        </div>
      </div>
    );
  }

  if (error || !collection || !brand) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 sm:px-6 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || "Collection not found"}
            </h1>
            <NavigationLink href="/collections">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Collections
              </Button>
            </NavigationLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <NavigationLink href="/collections" className="hover:text-oma-plum">
            Collections
          </NavigationLink>
          <span>/</span>
          <NavigationLink
            href={`/brand/${brand.id}`}
            className="hover:text-oma-plum"
          >
            {brand.name}
          </NavigationLink>
          <span>/</span>
          <span className="text-gray-900">{collection.title}</span>
        </div>

        {/* Collection Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Collection Image */}
          <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
            <AuthImage
              src={collection.image}
              alt={collection.title}
              width={600}
              height={600}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Collection Information */}
          <div className="space-y-6">
            {/* Brand Info */}
            <div className="flex items-center gap-3">
              <NavigationLink href={`/brand/${brand.id}`}>
                <div className="flex items-center gap-2 hover:text-oma-plum transition-colors">
                  <span className="font-medium">{brand.name}</span>
                  {brand.is_verified && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </NavigationLink>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="h-3 w-3" />
                {brand.location}
              </div>
            </div>

            {/* Collection Title */}
            <div>
              <h1 className="text-4xl font-canela text-gray-900 mb-4">
                {collection.title}
              </h1>
              <Badge variant="outline">{brand.category}</Badge>
            </div>

            {/* Collection Description */}
            {collection.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  About This Collection
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {collection.description}
                </p>
              </div>
            )}

            {/* Brand Rating */}
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Brand Rating:</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{brand.rating}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-canela text-gray-900">
              Products in this Collection
            </h2>
            <span className="text-gray-600">
              {products.length} product{products.length !== 1 ? "s" : ""}
            </span>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <ShoppingBag className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No products yet
              </h3>
              <p className="text-gray-600 mb-4">
                This collection doesn't have any products yet. Check back soon!
              </p>
              <NavigationLink href={`/brand/${brand.id}`}>
                <Button variant="outline">View Brand Profile</Button>
              </NavigationLink>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <NavigationLink
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group block"
                >
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="aspect-square relative overflow-hidden">
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
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-oma-plum transition-colors mb-1">
                        {product.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
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
                  </div>
                </NavigationLink>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
