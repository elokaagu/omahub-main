"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Star,
  MapPin,
  BadgeCheck,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LazyImage } from "@/components/ui/lazy-image";
import { Button } from "@/components/ui/button";
import { FavouriteButton } from "@/components/ui/favourite-button";
import { CollectionProductCard } from "./CollectionProductCard";
import { CollectionRecommendations } from "./CollectionRecommendations";
import {
  CATALOGUE_IMAGE_OBJECT_CLASS,
  splitParagraphs,
} from "./collectionPageUtils";
import type { CatalogueWithBrandForPage, CollectionProduct } from "./types";

interface ClientCollectionPageProps {
  catalogue: CatalogueWithBrandForPage;
  products: CollectionProduct[];
}

export default function ClientCollectionPage({
  catalogue,
  products,
}: ClientCollectionPageProps) {
  const { user } = useAuth();
  const descriptionParagraphs = splitParagraphs(catalogue.description);
  const brandStoryParagraphs = splitParagraphs(
    catalogue.brand.long_description
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
      <div className="max-w-7xl mx-auto px-6 py-24">
        <Link
          href="/collections"
          className="inline-flex items-center gap-2 text-black/70 hover:text-black transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Collections
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="relative aspect-[4/5] rounded-xl overflow-hidden">
            <LazyImage
              src={catalogue.image}
              alt={catalogue.title}
              fill
              className={CATALOGUE_IMAGE_OBJECT_CLASS}
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={true}
              aspectRatio="4/5"
              quality={85}
            />
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-canela text-black mb-4">
                {catalogue.title}
              </h1>

              <div className="flex items-center gap-3 mb-6">
                <Link
                  href={`/brand/${catalogue.brand.id}`}
                  className="flex items-center gap-2 text-oma-plum hover:text-oma-plum/80 transition-colors"
                >
                  <span className="text-lg font-medium">
                    {catalogue.brand.name}
                  </span>
                  {catalogue.brand.is_verified ? (
                    <BadgeCheck
                      className="w-5 h-5 text-oma-gold"
                      aria-label="Verified designer"
                    />
                  ) : null}
                </Link>
              </div>

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

              {descriptionParagraphs.length > 0 ? (
                <div className="prose text-oma-black max-w-none mb-6">
                  {descriptionParagraphs.map((paragraph, i) => (
                    <p key={i} className="mb-4 text-black/80 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : null}

              {brandStoryParagraphs.length > 0 ? (
                <div className="prose text-oma-black max-w-none">
                  {brandStoryParagraphs.map((paragraph, i) => (
                    <p key={i} className="mb-4 text-black/70 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>

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

        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <ShoppingBag className="w-6 h-6 text-black" />
            <h2 className="text-3xl font-canela text-black">
              Products in This Collection
            </h2>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16 bg-white/50 rounded-xl border border-oma-gold/10">
              <ShoppingBag className="w-16 h-16 text-black/30 mx-auto mb-4" />
              <h3 className="text-xl font-canela text-black mb-2">
                No products yet
              </h3>
              <p className="text-black/60">
                This collection doesn&apos;t have any products at the moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <CollectionProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        <CollectionRecommendations
          catalogueId={catalogue.id}
          brandId={catalogue.brand_id}
          userId={user?.id}
          showFavouritesHint={Boolean(user)}
        />
      </div>
    </div>
  );
}
