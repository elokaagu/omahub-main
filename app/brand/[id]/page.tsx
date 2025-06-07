"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getBrandById,
  getBrandReviews,
  getBrandCollections,
} from "@/lib/services/brandService";
import { Brand, Review, Catalogue } from "@/lib/supabase";
import ClientBrandProfile from "./ClientBrandProfile";

export default function BrandPage() {
  const { id } = useParams();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchBrandData() {
      if (!id || typeof id !== "string") return;

      try {
        // Fetch brand details
        const brandData = await getBrandById(id);
        setBrand(brandData);

        if (brandData) {
          // Fetch reviews and catalogues in parallel
          const [reviewsData, cataloguesData] = await Promise.all([
            getBrandReviews(id),
            getBrandCollections(id),
          ]);

          setReviews(reviewsData);
          setCatalogues(cataloguesData);
        }
      } catch (err) {
        console.error("Error fetching brand data:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchBrandData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-canela mb-4">Brand Not Found</h1>
        <p className="text-oma-cocoa/80 mb-8">
          Sorry, we couldn't find the brand you're looking for.
        </p>
        <button className="bg-oma-plum hover:bg-oma-plum/90 text-white px-6 py-2 rounded-lg">
          <a href="/directory">Browse All Brands</a>
        </button>
      </div>
    );
  }

  // Format the data for ClientBrandProfile
  const brandData = {
    id: brand.id,
    name: brand.name,
    description: brand.description || "",
    longDescription: brand.long_description,
    location: brand.location,
    priceRange: brand.price_range,
    category: brand.category,
    rating: brand.rating,
    isVerified: brand.is_verified,
    image: brand.image,
    collections: catalogues.map((catalogue) => ({
      id: catalogue.id,
      title: catalogue.title,
      image: catalogue.image,
      description: catalogue.description || "",
    })),
  };

  return <ClientBrandProfile brandData={brandData} />;
}
