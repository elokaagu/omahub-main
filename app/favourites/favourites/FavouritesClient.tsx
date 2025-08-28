"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useFavourites from "@/lib/hooks/useFavourites";
import { useAuth } from "@/contexts/AuthContext";
import { BrandCard } from "@/components/ui/brand-card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Define a proper Brand type
interface Brand {
  id: string;
  name: string;
  image: string;
  category: string;
  location: string;
  is_verified: boolean;
  rating: number;
}

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
        <Button onClick={() => router.refresh()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  // Show empty state
  if (!favourites || favourites.length === 0) {
    return (
      <div className="text-center py-16 bg-oma-beige/20 rounded-lg">
        <h2 className="text-2xl font-semibold mb-2">No favourites yet</h2>
        <p className="text-lg text-oma-cocoa mb-8">
          Save your favourite fashion brands to find them easily later.
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

  // Show favourites
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {(favourites as Brand[]).map((brand) => (
          <BrandCard
            key={brand.id}
            id={brand.id}
            name={brand.name}
            image={brand.brand_images?.[0]?.storage_path ? 
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/${brand.brand_images[0].storage_path}` : 
          "/placeholder-brand.jpg"}
            category={brand.category}
            location={brand.location}
            isVerified={brand.is_verified}
            rating={brand.rating}
          />
        ))}
      </div>
    </div>
  );
}
