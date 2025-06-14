"use client";

import useFavourites from "@/lib/hooks/useFavourites";
import { Loading } from "@/components/ui/loading";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function FavouritesPage() {
  const { favourites, loading } = useFavourites();

  return (
    <main className="max-w-7xl mx-auto px-4 py-12 min-h-screen">
      <h1 className="text-3xl font-canela mb-8 text-oma-plum">My Favourites</h1>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loading />
        </div>
      ) : favourites.length === 0 ? (
        <div className="text-center py-16 bg-white/50 rounded-xl border border-oma-gold/10">
          <h3 className="text-xl font-canela text-black mb-2">
            No favourites yet
          </h3>
          <p className="text-black/60 mb-4">
            You haven't added any favourites yet. Browse catalogues, products,
            or brands and click the heart icon to save your favourites.
          </p>
          <Button
            asChild
            className="bg-oma-plum text-white hover:bg-oma-plum/90"
          >
            <Link href="/catalogues">Browse Catalogues</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favourites.map((item: any) => (
            <Link
              key={item.id}
              href={
                item.title && item.brand_id
                  ? `/catalogue/${item.id}`
                  : item.category && item.price
                    ? `/product/${item.id}`
                    : `/designer/${item.id}`
              }
              className="group block bg-white rounded-xl overflow-hidden border border-oma-gold/10 hover:border-oma-gold/30 transition-all duration-300 hover:shadow-lg"
            >
              <div className="aspect-[4/3] relative overflow-hidden">
                <Image
                  src={item.image || "/placeholder.png"}
                  alt={item.title || item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-lg mb-1">
                  {item.title || item.name}
                </h3>
                {item.category && (
                  <p className="text-oma-cocoa/70 text-sm mb-2">
                    {item.category}
                  </p>
                )}
                {item.price && (
                  <p className="text-oma-plum font-medium">${item.price}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
