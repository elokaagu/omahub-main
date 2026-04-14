"use client";

import { NavigationLink } from "@/components/ui/navigation-link";
import { LazyImage } from "@/components/ui/lazy-image";
import type { BrandProfileCollection } from "./types";

interface BrandCollectionsSectionProps {
  collections: BrandProfileCollection[];
}

export function BrandCollectionsSection({ collections }: BrandCollectionsSectionProps) {
  if (collections.length === 0) {
    return null;
  }

  return (
    <div
      id="collections-section"
      className="my-8 sm:my-12 slide-up scroll-mt-20 sm:scroll-mt-24"
      style={{ animationDelay: "100ms" }}
    >
      <h2 className="text-2xl sm:text-3xl font-canela font-normal mb-4 sm:mb-6">
        Collections
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {collections.map((collection, index) => (
          <NavigationLink
            key={collection.id}
            href={`/collection/${collection.id}`}
            className="block group"
          >
            <div
              className="aspect-[4/5] relative overflow-hidden rounded-xl sm:rounded-2xl animate-[fadeIn_500ms_ease-in-out_forwards] opacity-0 transition-transform duration-300 group-hover:scale-105"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <LazyImage
                src={collection.image}
                alt={collection.title}
                fill
                className="object-cover rounded-xl sm:rounded-2xl"
                sizes="(max-width: 768px) 100vw, 400px"
                priority={true}
                aspectRatio="4/5"
                quality={85}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/70 transition-colors duration-300" />
              <div className="absolute bottom-0 left-0 p-4 sm:p-6">
                <h3 className="text-white text-lg sm:text-xl font-source group-hover:text-oma-gold transition-colors duration-300">
                  {collection.title}
                </h3>
                <p className="text-white/80 text-xs sm:text-sm mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Click to view catalogue
                </p>
              </div>
            </div>
          </NavigationLink>
        ))}
      </div>
    </div>
  );
}
