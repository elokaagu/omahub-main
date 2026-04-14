"use client";

import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useFavourites } from "@/contexts/FavouritesContext";
import type { FavouriteItem } from "@/lib/types/favouriteItem";
import { Loading } from "@/components/ui/loading";
import { LazyImage } from "@/components/ui/lazy-image";
import { Button } from "@/components/ui/button";
import { Heart, Store, BookOpen, ShoppingBag, RefreshCw } from "lucide-react";

const PLACEHOLDER_IMAGE = "/placeholder.jpg";

function isValidFavouriteItem(x: unknown): x is FavouriteItem {
  if (typeof x !== "object" || x === null) return false;
  const o = x as FavouriteItem;
  if (typeof o.id !== "string" || !o.id) return false;
  return (
    o.item_type === "brand" ||
    o.item_type === "catalogue" ||
    o.item_type === "product"
  );
}

function normalizeFavouritesList(favourites: unknown): FavouriteItem[] {
  if (!Array.isArray(favourites)) return [];
  return favourites.filter(isValidFavouriteItem);
}

function favouriteDisplayTitle(item: FavouriteItem): string {
  if (item.item_type === "brand") {
    return (item.name ?? item.title ?? "Brand").trim() || "Brand";
  }
  return (item.title ?? item.name ?? "Saved item").trim() || "Saved item";
}

function favouriteImageSrc(item: FavouriteItem): string {
  const u = typeof item.image === "string" ? item.image.trim() : "";
  return u.length > 0 ? u : PLACEHOLDER_IMAGE;
}

function favouriteCardKey(item: FavouriteItem): string {
  return item.favourite_id
    ? `${item.item_type}-${item.favourite_id}`
    : `${item.item_type}-${item.id}`;
}

type FavouriteSectionProps = {
  title: string;
  items: FavouriteItem[];
  icon: LucideIcon;
  emptyMessage: string;
  getHref: (item: FavouriteItem) => string;
};

function FavouriteSection({
  title,
  items,
  icon: Icon,
  emptyMessage,
  getHref,
}: FavouriteSectionProps) {
  return (
    <div className="mb-12">
      <div className="mb-6 flex items-center gap-3">
        <Icon className="h-6 w-6 text-oma-plum" aria-hidden />
        <h2 className="font-canela text-2xl text-black">{title}</h2>
        <span className="rounded-full bg-oma-plum/10 px-3 py-1 text-sm font-medium text-oma-plum">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-oma-gold/10 bg-oma-beige/20 py-8 text-center">
          <Icon
            className="mx-auto mb-3 h-12 w-12 text-oma-cocoa/40"
            aria-hidden
          />
          <p className="text-oma-cocoa/70">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => {
            const label = favouriteDisplayTitle(item);
            return (
              <Link
                key={favouriteCardKey(item)}
                href={getHref(item)}
                className="group block overflow-hidden rounded-xl border border-oma-gold/10 bg-white transition-all duration-300 hover:border-oma-gold/30 hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  <LazyImage
                    src={favouriteImageSrc(item)}
                    alt={label}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    aspectRatio="square"
                    quality={80}
                  />
                </div>
                <div className="p-4">
                  <h3 className="mb-1 text-lg font-medium transition-colors group-hover:text-oma-plum">
                    {label}
                  </h3>
                  {item.category ? (
                    <p className="mb-2 text-sm text-oma-cocoa/70">
                      {item.category}
                    </p>
                  ) : null}
                  {item.location ? (
                    <p className="mb-2 text-sm text-oma-cocoa/70">
                      {item.location}
                    </p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FavouritesPage() {
  const { favourites, loading, refreshFavourites } = useFavourites();

  const list = useMemo(
    () => normalizeFavouritesList(favourites),
    [favourites]
  );

  const brands = useMemo(
    () => list.filter((i) => i.item_type === "brand"),
    [list]
  );
  const collections = useMemo(
    () => list.filter((i) => i.item_type === "catalogue"),
    [list]
  );
  const products = useMemo(
    () => list.filter((i) => i.item_type === "product"),
    [list]
  );

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <Heart className="h-8 w-8 text-oma-plum" aria-hidden />
        <h1 className="font-canela text-4xl text-oma-plum">My Favourites</h1>
        {list.length > 0 ? (
          <span className="rounded-full bg-oma-plum px-4 py-2 text-lg font-medium text-white">
            {list.length}
          </span>
        ) : null}
        <Button
          type="button"
          onClick={() => void refreshFavourites()}
          variant="outline"
          size="sm"
          className="ml-auto border-oma-plum text-oma-plum hover:bg-oma-plum/10"
        >
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loading />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-oma-gold/10 bg-white/50 py-16 text-center">
          <Heart
            className="mx-auto mb-4 h-16 w-16 text-oma-cocoa/30"
            aria-hidden
          />
          <h3 className="mb-2 font-canela text-2xl text-black">
            No favourites yet
          </h3>
          <p className="mx-auto mb-6 max-w-md text-black/60">
            You haven&apos;t added any favourites yet. Browse collections,
            products, or brands and click the heart icon to save your
            favourites.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
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
