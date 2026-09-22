import Image from "next/image";
import Link from "next/link";
import type { BrandProfileCollection } from "./types";

/** The brand's catalogues, as a grid of cover cards. */
export function BrandCatalogueGrid({
  collections,
}: {
  collections: BrandProfileCollection[];
}) {
  if (collections.length === 0) return null;

  return (
    <section
      id="collections"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8"
    >
      <h2 className="font-canela text-2xl text-oma-black sm:text-3xl">
        Collections
      </h2>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3">
        {collections.map((collection) => (
          <Link
            key={collection.id}
            href={`/collection/${collection.id}`}
            className="group block focus-visible:outline-none"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-oma-beige/60 ring-1 ring-oma-gold/10 transition-shadow group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-oma-plum/50">
              {collection.image && (
                <Image
                  src={collection.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              )}
            </div>
            <h3 className="mt-3 truncate font-canela text-lg text-oma-black">
              {collection.title}
            </h3>
            {collection.description && (
              <p className="mt-1 line-clamp-2 text-sm text-oma-cocoa/80">
                {collection.description}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
