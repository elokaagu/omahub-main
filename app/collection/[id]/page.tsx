"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Heart,
  ArrowLeft,
  Star,
  MapPin,
  Verified,
  ShoppingBag,
} from "lucide-react";
import { getCollectionWithBrand } from "@/lib/services/collectionService";
import {
  getProductsByCatalogue,
  getIntelligentRecommendationsWithBrand,
} from "@/lib/services/productService";
import { Catalogue, Brand, Product } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { LazyImage } from "@/components/ui/lazy-image";
import { Button } from "@/components/ui/button";
import { FavouriteButton } from "@/components/ui/favourite-button";
import { formatProductPrice } from "@/lib/utils/priceFormatter";

type CatalogueWithBrand = Catalogue & {
  brand: {
    name: string;
    id: string;
    location: string;
    is_verified: boolean;
    category: string;
    rating: number;
    long_description: string;
    price_range?: string;
  };
  created_at?: string;
};

// Smart focal point detection for fashion/catalogue images
const getImageFocalPoint = (
  imageUrl: string,
  title: string,
  category?: string
) => {
  // For fashion and catalogue images, we always want to focus on the upper portion
  // where faces, necklines, and key design elements are usually located
  // Using center-top positioning to ensure faces are visible and centered
  return "object-center object-top";
};

export default function CataloguePage() {
  const params = useParams();
  const { user } = useAuth();
  const catalogueId = params.id as string;

  const [catalogue, setCatalogue] = useState<CatalogueWithBrand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<(Product & { brand: { price_range?: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch collection with brand info
        const collectionData = await getCollectionWithBrand(catalogueId);
        if (!collectionData) {
          setError("Collection not found");
          return;
        }
        setCatalogue(collectionData);

        // Fetch products in this collection
        const productsData = await getProductsByCatalogue(catalogueId);
        setProducts(productsData);

        // Fetch intelligent recommendations
        const recommendations = await getIntelligentRecommendationsWithBrand(
          user?.id,
          catalogueId,
          collectionData.brand_id,
          4
        );
        // Shuffle recommendations for variety
        const shuffled = [...recommendations].sort(() => Math.random() - 0.5);
        setRecommendedProducts(shuffled.slice(0, 4));
      } catch (err) {
        console.error("Error fetching catalogue data:", err);
        setError("Failed to load catalogue information");
      } finally {
        setLoading(false);
      }
    }

    if (catalogueId) {
      fetchData();
    }
  }, [catalogueId, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="animate-pulse">
            <div className="h-8 bg-oma-cocoa/10 rounded-lg mb-8 w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
              <div className="h-96 bg-oma-cocoa/10 rounded-xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-oma-cocoa/10 rounded w-3/4"></div>
                <div className="h-6 bg-oma-cocoa/10 rounded w-1/2"></div>
                <div className="h-20 bg-oma-cocoa/10 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !catalogue) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center">
            <h1 className="text-3xl font-canela text-black mb-4">
              {error || "Catalogue not found"}
            </h1>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 text-oma-plum hover:text-oma-plum/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Collections
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* Back Button */}
        <Link
          href="/collections"
          className="inline-flex items-center gap-2 text-black/70 hover:text-black transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Collections
        </Link>

        {/* Catalogue Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Catalogue Image */}
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
            <LazyImage
              src={catalogue.image}
              alt={catalogue.title}
              fill
              className={`object-cover ${getImageFocalPoint(catalogue.image, catalogue.title, catalogue.brand.category)}`}
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={true}
              aspectRatio="4/3"
              quality={85}
            />
          </div>

          {/* Catalogue Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-canela text-black mb-4">
                {catalogue.title}
              </h1>

              {/* Brand Info */}
              <div className="flex items-center gap-3 mb-6">
                <Link
                  href={`/brand/${catalogue.brand.id}`}
                  className="flex items-center gap-2 text-oma-plum hover:text-oma-plum/80 transition-colors"
                >
                  <span className="text-lg font-medium">
                    {catalogue.brand.name}
                  </span>
                  {catalogue.brand.is_verified && (
                    <Verified className="w-5 h-5 text-oma-gold" />
                  )}
                </Link>
              </div>

              {/* Brand Details */}
              <div className="flex flex-wrap gap-4 text-sm text-black/70 mb-6">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {catalogue.brand.location}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-current text-oma-gold" />
                  {catalogue.brand.rating}/5
                </div>
                <div className="bg-oma-gold/20 text-black px-2 py-1 rounded-full text-xs">
                  {catalogue.brand.category}
                </div>
              </div>

              {/* Description */}
              {catalogue.description && (
                <div className="prose text-oma-black max-w-none mb-6">
                  {catalogue.description.split("\n\n").map((paragraph, i) => (
                    <p key={i} className="mb-4 text-black/80 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}

              {/* Brand Description */}
              <div className="prose text-oma-black max-w-none">
                {catalogue.brand.long_description
                  .split("\n\n")
                  .map((paragraph: string, i: number) => (
                    <p key={i} className="mb-4 text-black/70 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Link
                href={`/brand/${catalogue.brand.id}`}
                className="min-w-[180px]"
              >
                <Button className="w-full px-6 py-3 text-base bg-oma-plum hover:bg-oma-plum/90 text-white">
                  View Brand Profile
                </Button>
              </Link>
              <FavouriteButton
                itemId={catalogue.id}
                itemType="catalogue"
                className="w-full px-6 py-3 min-w-[180px] text-base"
              />
            </div>
          </div>
        </div>

        {/* Products in This Catalogue */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <ShoppingBag className="w-6 h-6 text-black" />
            <h2 className="text-3xl font-canela text-black">
              Products in This Catalogue
            </h2>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16 bg-white/50 rounded-xl border border-oma-gold/10">
              <ShoppingBag className="w-16 h-16 text-black/30 mx-auto mb-4" />
              <h3 className="text-xl font-canela text-black mb-2">
                No products yet
              </h3>
              <p className="text-black/60">
                This catalogue doesn't have any products at the moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group block"
                >
                  <div className="bg-white/80 rounded-xl overflow-hidden border border-oma-gold/10 hover:border-oma-gold/30 transition-all duration-300 hover:shadow-lg group-hover:-translate-y-1">
                    <div className="aspect-square relative overflow-hidden">
                      <LazyImage
                        src={product.image}
                        alt={product.title}
                        fill
                        className={`object-cover ${getImageFocalPoint(
                          product.image,
                          product.title,
                          product.category
                        )} group-hover:scale-105 transition-transform duration-300`}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        priority={false}
                        aspectRatio="square"
                        quality={80}
                      />
                      {product.sale_price && (
                        <div className="absolute top-3 left-3 bg-oma-plum text-white text-xs px-2 py-1 rounded-full">
                          Sale
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-black mb-2 group-hover:text-oma-plum transition-colors line-clamp-2">
                        {product.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {product.sale_price ? (
                          <>
                            <span className="text-lg font-semibold text-oma-plum">
                              {formatProductPrice({ price: product.price, sale_price: product.sale_price }, { price_range: catalogue.brand.price_range }).displayPrice}
                            </span>
                            <span className="text-sm text-black/60 line-through">
                              {formatProductPrice({ price: product.price, sale_price: product.sale_price }, { price_range: catalogue.brand.price_range }).originalPrice}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-semibold text-black">
                            {formatProductPrice({ price: product.price, sale_price: product.sale_price }, { price_range: catalogue.brand.price_range }).displayPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* You May Also Like */}
        {recommendedProducts.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Heart className="w-6 h-6 text-black" />
              <h2 className="text-3xl font-canela text-black">
                You May Also Like
              </h2>
              {user && (
                <span className="text-sm text-black/60 bg-oma-beige/50 px-3 py-1 rounded-full">
                  Based on your favourites
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group block"
                >
                  <div className="bg-white/80 rounded-xl overflow-hidden border border-oma-gold/10 hover:border-oma-gold/30 transition-all duration-300 hover:shadow-lg group-hover:-translate-y-1">
                    <div className="aspect-square relative overflow-hidden">
                      <LazyImage
                        src={product.image}
                        alt={product.title}
                        fill
                        className={`object-cover ${getImageFocalPoint(
                          product.image,
                          product.title,
                          product.category
                        )} group-hover:scale-105 transition-transform duration-300`}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        priority={false}
                        aspectRatio="square"
                        quality={80}
                      />
                      {product.sale_price && (
                        <div className="absolute top-3 left-3 bg-oma-plum text-white text-xs px-2 py-1 rounded-full">
                          Sale
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-black mb-2 group-hover:text-oma-plum transition-colors line-clamp-2">
                        {product.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {product.sale_price ? (
                          <>
                            <span className="text-lg font-semibold text-oma-plum">
                              {formatProductPrice({ price: product.price, sale_price: product.sale_price }, { price_range: product.brand?.price_range }).displayPrice}
                            </span>
                            <span className="text-sm text-black/60 line-through">
                              {formatProductPrice({ price: product.price, sale_price: product.sale_price }, { price_range: product.brand?.price_range }).originalPrice}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-semibold text-black">
                            {formatProductPrice({ price: product.price, sale_price: product.sale_price }, { price_range: product.brand?.price_range }).displayPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
