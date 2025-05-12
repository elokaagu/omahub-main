"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, MapPin, Star } from "lucide-react";
import ContactDesignerModal from "@/components/ContactDesignerModal";

interface Review {
  author: string;
  comment: string;
  rating: number;
  date: string;
}

interface Collection {
  id: number;
  title: string;
  image: string;
}

interface BrandData {
  name: string;
  description: string;
  longDescription: string;
  location: string;
  priceRange: string;
  category: string;
  rating: number;
  reviews: Review[];
  isVerified: boolean;
  collections: Collection[];
}

interface ClientBrandProfileProps {
  brandData: BrandData;
}

export default function ClientBrandProfile({
  brandData,
}: ClientBrandProfileProps) {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

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
                {brandData.rating} ({brandData.reviews.length} reviews)
              </span>
            </div>
          </div>

          <p className="text-lg max-w-3xl">{brandData.description}</p>
        </div>

        {/* Collection Grid */}
        <div className="my-12 slide-up" style={{ animationDelay: "100ms" }}>
          <h2 className="heading-sm mb-6">Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brandData.collections.map((collection, index) => (
              <div
                key={collection.id}
                className="aspect-[4/5] relative overflow-hidden rounded-2xl animate-[fadeIn_500ms_ease-in-out_forwards] opacity-0"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <img
                  src={collection.image}
                  alt={collection.title}
                  className="w-full h-full object-cover rounded-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="text-white text-xl font-source">
                    {collection.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
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

            <Separator className="my-6 bg-oma-gold/20" />

            <Button
              onClick={() => setIsContactModalOpen(true)}
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
          <h2 className="heading-sm mb-6">Customer Reviews</h2>
          <div className="space-y-6">
            {brandData.reviews?.map((review, index) => (
              <div
                key={index}
                className="border-b border-oma-gold/10 last:border-0 pb-4 last:pb-0"
              >
                <div className="flex items-center mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={
                          i < review.rating
                            ? "text-oma-gold fill-oma-gold"
                            : "text-oma-gold/20"
                        }
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-oma-cocoa">
                    {review.date}
                  </span>
                </div>
                <p className="text-oma-black mb-2">{review.comment}</p>
                <p className="text-sm text-oma-cocoa">- {review.author}</p>
              </div>
            ))}
          </div>
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
