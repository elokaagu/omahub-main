"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useFavourites from "@/lib/hooks/useFavourites";
import { useAuth } from "@/contexts/AuthContext";
import { BrandCard } from "@/components/ui/brand-card";
import { ProductCard } from "@/components/ui/product-card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Define proper types for different favourite items
interface Brand {
  id: string;
  name: string;
  image: string;
  category: string;
  location: string;
  is_verified: boolean;
  rating: number;
  item_type: "brand";
  // New normalized image structure
  brand_images?: Array<{
    id: string;
    role: string;
    storage_path: string;
    created_at: string;
    updated_at: string;
  }>;
}

interface Product {
  id: string;
  title: string;
  image: string;
  price: number;
  sale_price?: number;
  category: string;
  item_type: "product";
  brand?: {
    name: string;
    location?: string;
    price_range?: string;
    currency?: string;
  };
}

interface Catalogue {
  id: string;
  title: string;
  image: string;
  brand_id: string;
  description?: string;
  item_type: "catalogue";
}

type FavouriteItem = Brand | Product | Catalogue;

export default function FavouritesClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { favourites, loading, error } = useFavourites();

  useEffect(() => {
    // Redirect to login if not authenticated and auth is not loading
    if (!authLoading && !user) {
      router.push("/login?redirect=favourites");
    }
  }, [user, authLoading, router]);

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 text-oma-plum animate-spin mb-4" />
        <p className="text-oma-cocoa">Loading your favourites...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">{error}</p>
      </div>
    );
  }

  // Show empty state
  if (!favourites || favourites.length === 0) {
    return (
      <div className="text-center py-16 bg-oma-beige/20 rounded-lg">
        <h2 className="text-2xl font-semibold mb-2">No favourites yet</h2>
        <p className="text-lg text-oma-cocoa mb-8">
          Save your favourite fashion brands and products to find them easily later.
        </p>
        <Button
          onClick={() => router.push("/")}
          className="bg-oma-plum hover:bg-oma-plum/90 text-white"
        >
          Explore Brands
        </Button>
      </div>
    );
  }

  // Group favourites by type
  const brands = favourites.filter((item): item is Brand => item.item_type === "brand");
  const products = favourites.filter((item): item is Product => item.item_type === "product");
  const catalogues = favourites.filter((item): item is Catalogue => item.item_type === "catalogue");

  // Show favourites organized by type
  return (
    <div className="space-y-8">
      {/* Products Section */}
      {products.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-oma-cocoa">
            Favourite Products ({products.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                image={product.image}
                price={product.price}
                sale_price={product.sale_price}
                category={product.category}
                brand={product.brand}
              />
            ))}
          </div>
        </div>
      )}

      {/* Brands Section */}
      {brands.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-oma-cocoa">
            Favourite Brands ({brands.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {brands.map((brand) => (
              <BrandCard
                key={brand.id}
                id={brand.id}
                name={brand.name}
                image={
                  brand.brand_images?.[0]?.storage_path
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/${brand.brand_images[0].storage_path}`
                    : "/placeholder-brand.jpg"
                }
                category={brand.category}
                location={brand.location}
                isVerified={brand.is_verified}
                rating={brand.rating}
              />
            ))}
          </div>
        </div>
      )}

      {/* Catalogues Section */}
      {catalogues.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-oma-cocoa">
            Favourite Collections ({catalogues.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {catalogues.map((catalogue) => (
              <div
                key={catalogue.id}
                className="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full"
              >
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={catalogue.image}
                    alt={catalogue.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-black mb-2 group-hover:text-oma-plum transition-colors line-clamp-2">
                    {catalogue.title}
                  </h3>
                  {catalogue.description && (
                    <p className="text-oma-cocoa/70 text-sm line-clamp-2">
                      {catalogue.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
