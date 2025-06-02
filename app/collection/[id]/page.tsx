"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getCollectionById } from "@/lib/services/collectionService";
import { getBrandById } from "@/lib/services/brandService";
import { getCollectionImages } from "@/lib/services/collectionImageService";
import { Collection, Brand } from "@/lib/supabase";
import { CollectionImage } from "@/lib/services/collectionImageService";
import { AuthImage } from "@/components/ui/auth-image";
import { Button } from "@/components/ui/button";
import { NavigationLink } from "@/components/ui/navigation-link";
import { ArrowLeft, MapPin, Globe, Instagram } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default function CollectionPage() {
  const params = useParams();
  const collectionId = params.id as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [collectionImages, setCollectionImages] = useState<CollectionImage[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch collection data
        const collectionData = await getCollectionById(collectionId);
        if (!collectionData) {
          notFound();
          return;
        }

        setCollection(collectionData);

        // Fetch brand data and collection images in parallel
        const [brandData, imagesData] = await Promise.all([
          getBrandById(collectionData.brand_id),
          getCollectionImages(collectionId),
        ]);

        if (brandData) {
          setBrand(brandData);
        }

        setCollectionImages(imagesData);
      } catch (error) {
        console.error("Error fetching collection:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    if (collectionId) {
      fetchData();
    }
  }, [collectionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!collection || !brand) {
    notFound();
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" asChild className="h-8 w-8">
            <NavigationLink href={`/brand/${brand.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </NavigationLink>
          </Button>
          <div>
            <h1 className="text-3xl font-canela text-gray-900">
              {collection.title}
            </h1>
            <p className="text-gray-600">by {brand.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Collection Image */}
          <div className="lg:col-span-2">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              <AuthImage
                src={collection.image}
                alt={collection.title}
                width={800}
                height={800}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Collection Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-canela mb-4">
                About this Collection
              </h2>
              {collection.description ? (
                <p className="text-gray-600 mb-4">{collection.description}</p>
              ) : (
                <p className="text-gray-600 mb-4">
                  Explore the {collection.title} collection by {brand.name},
                  featuring unique designs that showcase the brand's distinctive
                  style and craftsmanship.
                </p>
              )}
            </div>

            {/* Brand Info */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">About {brand.name}</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{brand.location}</span>
                </div>

                {brand.website && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Globe className="h-4 w-4" />
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-oma-plum transition-colors"
                    >
                      Visit Website
                    </a>
                  </div>
                )}

                {brand.instagram && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Instagram className="h-4 w-4" />
                    <a
                      href={brand.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-oma-plum transition-colors"
                    >
                      Follow on Instagram
                    </a>
                  </div>
                )}
              </div>

              <p className="text-gray-600 mt-4">{brand.description}</p>

              <div className="mt-6">
                <Button
                  asChild
                  className="w-full bg-oma-plum hover:bg-oma-plum/90"
                >
                  <NavigationLink href={`/brand/${brand.id}`}>
                    View All {brand.name} Collections
                  </NavigationLink>
                </Button>
              </div>
            </div>

            {/* Categories */}
            {brand.categories && brand.categories.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {brand.categories.map((category) => (
                    <span
                      key={category}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Collection Gallery */}
        {collectionImages.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-canela mb-6">Collection Gallery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {collectionImages.map((image, index) => (
                <div
                  key={image.id}
                  className="aspect-square rounded-lg overflow-hidden bg-gray-100 group"
                >
                  <AuthImage
                    src={image.image_url}
                    alt={
                      image.alt_text ||
                      `${collection.title} - Image ${index + 1}`
                    }
                    width={400}
                    height={400}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fallback gallery if no additional images */}
        {collectionImages.length === 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-canela mb-6">Collection Gallery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Show main collection image as placeholder */}
              {[1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                >
                  <AuthImage
                    src={collection.image}
                    alt={`${collection.title} - Image ${index}`}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
