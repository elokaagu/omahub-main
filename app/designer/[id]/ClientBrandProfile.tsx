"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, MapPin, Star } from "@/components/ui/icons";
import { Instagram, Globe, MessageCircle } from "lucide-react";
import {
  WhatsAppContact,
  isValidWhatsAppNumber,
  formatPhoneForDisplay,
} from "@/components/ui/whatsapp-contact";
import ContactDesignerModal from "@/components/ContactDesignerModal";
import { ReviewForm } from "@/components/ui/review-form";
import { ReviewDisplay } from "@/components/ui/review-display";
import useReviews from "@/lib/hooks/useReviews";
import type { BrandData } from "@/lib/data/brands";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "next/navigation";
import Link from "next/link";
import { NavigationLink } from "@/components/ui/navigation-link";

interface ClientBrandProfileProps {
  brandData: BrandData;
}

export default function ClientBrandProfile({
  brandData,
}: ClientBrandProfileProps) {
  const { user } = useAuth();
  const params = useParams();
  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : null;

  console.log("Brand params:", params);
  console.log("Extracted brand ID:", id);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const { reviews, loading, error, fetchReviews } = useReviews(id as string);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Scroll to collections function
  const scrollToCatalogues = () => {
    const collectionsSection = document.getElementById("catalogues-section");
    if (collectionsSection) {
      collectionsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Fetch reviews when component mounts
  useEffect(() => {
    console.log("Fetching reviews for brand ID:", id);
    if (id) {
      fetchReviews();
    }
  }, [fetchReviews, id]);

  const handleReviewSubmitted = () => {
    // Hide the review form and refresh reviews
    setShowReviewForm(false);
    fetchReviews();
  };

  const handleShowReviewForm = () => {
    console.log("Opening review form for brand ID:", id);
    setShowReviewForm(true);
  };

  const handleOpenContactModal = () => {
    console.log("Opening contact modal for brand:", brandData.name);
    setIsContactModalOpen(true);
  };

  return (
    <section className="pt-24 pb-16 px-6 fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 slide-up">
          <div className="flex items-center mb-2">
            <Badge className="bg-oma-beige text-oma-cocoa border-oma-gold/20">
              {brandData.category}
            </Badge>
            {brandData.isVerified && (
              <div className="flex items-center ml-3 text-oma-gold text-sm">
                <CheckCircle size={16} className="mr-1" />
                <span>Verified Designer</span>
              </div>
            )}
          </div>

          <h1 className="heading-lg mb-2">{brandData.name}</h1>

          <div className="flex items-center text-oma-cocoa mb-6">
            <MapPin size={16} className="mr-1" />
            <span>{brandData.location}</span>
            <div className="flex items-center ml-6">
              <Star size={16} className="mr-1 text-oma-gold" />
              <span>
                {brandData.rating} ({reviews.length} reviews)
              </span>
            </div>
          </div>

          <div className="prose text-oma-black max-w-none">
            {brandData.description.split("\n\n").map((paragraph, i) => (
              <p key={i} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="flex gap-4">
            <Button
              onClick={scrollToCatalogues}
              className="bg-oma-plum hover:bg-oma-plum/90"
            >
              View Catalogues
            </Button>
            {/* WhatsApp Button - Only show if WhatsApp is available */}
            {brandData.whatsapp &&
              isValidWhatsAppNumber(brandData.whatsapp) && (
                <WhatsAppContact
                  phoneNumber={brandData.whatsapp}
                  brandName={brandData.name}
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
                >
                  <MessageCircle size={16} className="mr-2" />
                  WhatsApp
                </WhatsAppContact>
              )}
            <Button
              onClick={handleOpenContactModal}
              variant="outline"
              className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
            >
              Contact Designer
            </Button>
          </div>
        </div>

        {/* Catalogue Grid */}
        <div
          id="catalogues-section"
          className="my-12 slide-up scroll-mt-24"
          style={{ animationDelay: "100ms" }}
        >
          <h2 className="heading-sm mb-6">Catalogues</h2>
          {brandData.collections.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No catalogues available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {brandData.collections.map((collection, index) => (
                <NavigationLink
                  key={collection.id}
                  href={`/catalogue/${collection.id}`}
                  className="block group"
                >
                  <div
                    className="aspect-[4/5] relative overflow-hidden rounded-2xl animate-[fadeIn_500ms_ease-in-out_forwards] opacity-0 transition-transform duration-300 group-hover:scale-105"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <img
                      src={collection.image}
                      alt={collection.title}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/70 transition-colors duration-300" />
                    <div className="absolute bottom-0 left-0 p-6">
                      <h3 className="text-white text-xl font-source group-hover:text-oma-gold transition-colors duration-300">
                        {collection.title}
                      </h3>
                      <p className="text-white/80 text-sm mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Click to view catalogue
                      </p>
                    </div>
                  </div>
                </NavigationLink>
              ))}
            </div>
          )}
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 my-12 slide-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="md:col-span-2">
            <h2 className="heading-sm mb-4">About {brandData.name}</h2>
            <div className="prose text-oma-black max-w-none">
              {brandData.longDescription.split("\n\n").map((paragraph, i) => (
                <p key={i} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <div className="bg-oma-beige p-6 rounded-lg h-fit">
            <h3 className="font-canela text-xl mb-4">Designer Information</h3>

            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-1">Price Range</h4>
              <p>{brandData.priceRange}</p>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-1">Location</h4>
              <p>{brandData.location}</p>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-semibold mb-1">Category</h4>
              <p>{brandData.category}</p>
            </div>

            {/* Contact Options */}
            <div className="space-y-3 mb-6">
              <h4 className="text-sm font-semibold">Connect with Designer</h4>

              {/* WhatsApp Contact */}
              {brandData.whatsapp &&
                isValidWhatsAppNumber(brandData.whatsapp) && (
                  <WhatsAppContact
                    phoneNumber={brandData.whatsapp}
                    brandName={brandData.name}
                    variant="outline"
                    className="w-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 hover:text-green-800"
                    size="sm"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp {formatPhoneForDisplay(brandData.whatsapp)}
                  </WhatsAppContact>
                )}

              {/* Instagram Link */}
              {brandData.instagram && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100 hover:border-pink-300 hover:text-pink-800"
                  onClick={() =>
                    window.open(
                      brandData.instagram?.startsWith("http")
                        ? brandData.instagram
                        : `https://instagram.com/${brandData.instagram}`,
                      "_blank"
                    )
                  }
                >
                  <Instagram className="h-4 w-4 mr-2" />
                  Instagram
                </Button>
              )}

              {/* Website Link */}
              {brandData.website && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800"
                  onClick={() =>
                    window.open(
                      brandData.website?.startsWith("http")
                        ? brandData.website
                        : `https://${brandData.website}`,
                      "_blank"
                    )
                  }
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Website
                </Button>
              )}
            </div>

            <Separator className="my-6 bg-oma-gold/20" />

            <Button
              onClick={handleOpenContactModal}
              className="w-full bg-oma-plum hover:bg-oma-plum/90"
            >
              Contact Designer
            </Button>
          </div>
        </div>

        {/* Reviews Section */}
        <div
          className="my-12 border border-oma-gold/20 rounded-lg p-6 bg-oma-beige/30 slide-up"
          style={{ animationDelay: "300ms" }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="heading-sm">Customer Reviews</h2>
            {!showReviewForm && (
              <Button
                onClick={handleShowReviewForm}
                className="bg-oma-plum hover:bg-oma-plum/90 text-white"
              >
                Write a Review
              </Button>
            )}
          </div>

          {showReviewForm && (
            <div className="mb-8">
              <ReviewForm
                brandId={id as string}
                onReviewSubmitted={handleReviewSubmitted}
                className="mb-6"
              />
              <Button
                variant="outline"
                onClick={() => setShowReviewForm(false)}
                className="mb-6"
              >
                Cancel
              </Button>
            </div>
          )}

          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-500 rounded">{error}</div>
          ) : reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <ReviewDisplay
                  key={review.id}
                  id={review.id}
                  author={review.author}
                  comment={review.comment}
                  rating={review.rating}
                  date={review.date}
                  created_at={review.created_at}
                  replies={review.replies}
                  showReplies={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-oma-cocoa">
              <p>No reviews yet. Be the first to share your experience!</p>
            </div>
          )}
        </div>
      </div>

      <ContactDesignerModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        brandName={brandData.name}
      />
    </section>
  );
}
