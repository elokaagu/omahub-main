"use client";

import { useEffect, useCallback } from "react";
import { useFavourites } from "@/contexts/FavouritesContext";
import { Loading } from "@/components/ui/loading";
import Link from "next/link";
import { LazyImage } from "@/components/ui/lazy-image";
import { Button } from "@/components/ui/button";
import { Heart, Store, BookOpen, ShoppingBag, RefreshCw } from "lucide-react";
import { formatProductPrice } from "@/lib/utils/priceFormatter";

export default function FavouritesPage() {
  const { favourites, loading, refreshFavourites } = useFavourites();

  // Create a stable callback for refresh
  const handleRefresh = useCallback(() => {
    refreshFavourites();
  }, [refreshFavourites]);

  // Refresh favourites when the page loads to ensure we have the latest data
  useEffect(() => {
    handleRefresh();

    // Set up periodic refresh every 30 seconds to catch changes from other parts of the app
    const interval = setInterval(handleRefresh, 30000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array to run only once on mount

  // Separate favourites by type
  const brands = (Array.isArray(favourites) ? favourites : []).filter(
    (item: any) => item.name && !item.brand_id && !item.price
  );
  const collections = (Array.isArray(favourites) ? favourites : []).filter(
    (item: any) => item.title && item.brand_id && !item.price
  );
  const products = (Array.isArray(favourites) ? favourites : []).filter(
    (item: any) => item.title && item.price
  );

  const FavouriteSection = ({
    title,
    items,
    icon: Icon,
    emptyMessage,
    getHref,
  }: {
    title: string;
    items: any[];
    icon: any;
    emptyMessage: string;
    getHref: (item: any) => string;
  }) => (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <Icon className="w-6 h-6 text-oma-plum" />
        <h2 className="text-2xl font-canela text-black">{title}</h2>
        <span className="bg-oma-plum/10 text-oma-plum px-3 py-1 rounded-full text-sm font-medium">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 bg-oma-beige/20 rounded-xl border border-oma-gold/10">
          <Icon className="w-12 h-12 text-oma-cocoa/40 mx-auto mb-3" />
          <p className="text-oma-cocoa/70">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item: any) => (
            <Link
              key={item.id}
              href={getHref(item)}
              className="group block bg-white rounded-xl overflow-hidden border border-oma-gold/10 hover:border-oma-gold/30 transition-all duration-300 hover:shadow-lg"
            >
              <div className="aspect-square relative overflow-hidden rounded-lg">
                <LazyImage
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  aspectRatio="square"
                  quality={80}
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-lg mb-1 group-hover:text-oma-plum transition-colors">
                  {item.title || item.name}
                </h3>
                {item.category && (
                  <p className="text-oma-cocoa/70 text-sm mb-2">
                    {item.category}
                  </p>
                )}
                {item.location && (
                  <p className="text-oma-cocoa/70 text-sm mb-2">
                    {item.location}
                  </p>
                )}
                {/* Price removed from favourite products cards */}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <main className="max-w-7xl mx-auto px-4 py-12 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="w-8 h-8 text-oma-plum" />
        <h1 className="text-4xl font-canela text-oma-plum">My Favourites</h1>
        {favourites.length > 0 && (
          <span className="bg-oma-plum text-white px-4 py-2 rounded-full text-lg font-medium">
            {favourites.length}
          </span>
        )}
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="ml-auto border-oma-plum text-oma-plum hover:bg-oma-plum/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loading />
        </div>
      ) : favourites.length === 0 ? (
        <div className="text-center py-16 bg-white/50 rounded-xl border border-oma-gold/10">
          <Heart className="w-16 h-16 text-oma-cocoa/30 mx-auto mb-4" />
          <h3 className="text-2xl font-canela text-black mb-2">
            No favourites yet
          </h3>
          <p className="text-black/60 mb-6 max-w-md mx-auto">
            You haven't added any favourites yet. Browse collections, products,
            or brands and click the heart icon to save your favourites.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              className="bg-oma-plum text-white hover:bg-oma-plum/90"
            >
              <Link href="/collections">Browse Collections</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-oma-plum text-oma-plum hover:bg-oma-plum/10"
            >
              <Link href="/">Explore Brands</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          <FavouriteSection
            title="Favourite Brands"
            items={brands}
            icon={Store}
            emptyMessage="No favourite brands yet. Discover amazing designers and save your favourites!"
            getHref={(item) => `/brand/${item.id}`}
          />

          <FavouriteSection
            title="Favourite Collections"
            items={collections}
            icon={BookOpen}
            emptyMessage="No favourite collections yet. Browse designer collections and save the ones you love!"
            getHref={(item) => `/collection/${item.id}`}
          />

          <FavouriteSection
            title="Favourite Products"
            items={products}
            icon={ShoppingBag}
            emptyMessage="No favourite products yet. Find stunning pieces and add them to your wishlist!"
            getHref={(item) => `/product/${item.id}`}
          />
        </div>
      )}
    </main>
  );
}
