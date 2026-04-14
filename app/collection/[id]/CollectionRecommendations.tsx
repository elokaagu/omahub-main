"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { getIntelligentRecommendationsWithBrand } from "@/lib/services/productService";
import { RecommendationProductCard } from "./CollectionProductCard";
import { shuffleCopy } from "./collectionPageUtils";
import type { RecommendedProduct } from "./types";

interface CollectionRecommendationsProps {
  catalogueId: string;
  brandId: string;
  userId?: string;
  showFavouritesHint: boolean;
}

export function CollectionRecommendations({
  catalogueId,
  brandId,
  userId,
  showFavouritesHint,
}: CollectionRecommendationsProps) {
  const [items, setItems] = useState<RecommendedProduct[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const raw = await getIntelligentRecommendationsWithBrand(
          userId,
          catalogueId,
          brandId,
          8
        );
        if (cancelled) return;
        setItems(shuffleCopy(raw).slice(0, 4));
      } catch (e) {
        console.error("Collection recommendations failed:", e);
        if (!cancelled) setItems([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [catalogueId, brandId, userId]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Heart className="w-6 h-6 text-black" />
        <h2 className="text-3xl font-canela text-black">You May Also Like</h2>
        {showFavouritesHint ? (
          <span className="text-sm text-black/60 bg-oma-beige/50 px-3 py-1 rounded-full">
            Based on your favourites
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((product) => (
          <RecommendationProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
