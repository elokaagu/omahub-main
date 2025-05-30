"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  getBrandById,
  getBrandReviews,
  getBrandCollections,
} from "@/lib/services/brandService";
import { Brand, Review, Collection } from "@/lib/supabase";
import { CheckCircle } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/AuthContext";
import ContactDesignerModal from "@/components/ContactDesignerModal";
import { ReviewForm } from "@/components/ui/review-form";

export default function BrandPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    async function fetchBrandData() {
      if (!id || typeof id !== "string") return;

      try {
        // Fetch brand details
        const brandData = await getBrandById(id);
        setBrand(brandData);

        if (brandData) {
          // Fetch reviews and collections in parallel
          const [reviewsData, collectionsData] = await Promise.all([
            getBrandReviews(id),
            getBrandCollections(id),
          ]);

          setReviews(reviewsData);
          setCollections(collectionsData);
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

  const handleReviewSubmitted = () => {
    // Hide the review form and refresh reviews
    setShowReviewForm(false);

    // Refetch reviews
    if (id && typeof id === "string") {
      getBrandReviews(id).then((reviewsData) => {
        setReviews(reviewsData);
      });
    }
  };

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
        <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
          <a href="/directory">Browse All Brands</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-oma-beige/50 to-white">
      {/* Brand Header */}
      <section className="pt-16 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Brand Image */}
            <div className="w-full md:w-1/3">
              <div className="aspect-square relative rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={brand.image}
                  alt={brand.name}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Brand Info */}
            <div className="w-full md:w-2/3">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-canela">
                  {brand.name}
                </h1>
                {brand.is_verified && (
                  <CheckCircle className="h-6 w-6 text-oma-plum" />
                )}
              </div>

              <div className="flex items-center gap-3 text-sm text-oma-cocoa mb-4">
                <span className="px-2 py-1 bg-oma-beige/50 rounded">
                  {brand.category}
                </span>
                <span>•</span>
                <span>{brand.location}</span>
                <span>•</span>
                <span>★ {brand.rating.toFixed(1)}</span>
                <span>•</span>
                <span>{reviews.length} reviews</span>
              </div>

              <p className="text-oma-cocoa mb-6">{brand.description}</p>

              <div className="mb-6">
                <h3 className="font-medium mb-2">Price Range</h3>
                <p className="text-oma-cocoa">{brand.price_range}</p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button
                  className="bg-oma-plum hover:bg-oma-plum/90"
                  onClick={() => setIsContactModalOpen(true)}
                >
                  Contact Designer
                </Button>
                <Button
                  variant="outline"
                  className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
                >
                  View Collection
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Description */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-canela mb-6">About {brand.name}</h2>
          <div className="prose max-w-none text-oma-cocoa">
            <p>{brand.long_description}</p>
          </div>
        </div>
      </section>

      {/* Collections */}
      {collections.length > 0 && (
        <section className="py-12 px-6 bg-oma-beige/30">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-canela mb-8">Collections</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="aspect-[4/3] relative">
                    <Image
                      src={collection.image}
                      alt={collection.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-lg">{collection.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-canela">Customer Reviews</h2>
            {!showReviewForm && user && (
              <Button
                className="bg-oma-plum hover:bg-oma-plum/90"
                onClick={() => setShowReviewForm(true)}
              >
                Write a Review
              </Button>
            )}
          </div>

          {showReviewForm && (
            <div className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <ReviewForm
                brandId={id as string}
                onReviewSubmitted={handleReviewSubmitted}
                className="mb-4"
              />
              <Button
                variant="outline"
                onClick={() => setShowReviewForm(false)}
                className="mt-2"
              >
                Cancel
              </Button>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="text-center py-8 bg-oma-beige/20 rounded-lg">
              <p className="text-oma-cocoa">
                No reviews yet. Be the first to review!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium">{review.author}</h3>
                    <div className="flex items-center">
                      <span className="text-oma-plum mr-1">★</span>
                      <span>{review.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="text-oma-cocoa mb-2">{review.comment}</p>
                  <p className="text-sm text-oma-cocoa/60">{review.date}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact Designer Modal */}
      <ContactDesignerModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        brandName={brand.name}
      />
    </div>
  );
}
