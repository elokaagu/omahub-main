import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/supabase";
import { getProductMainImage } from "@/lib/utils/productImageUtils";
import { formatProductPrice } from "@/lib/utils/priceFormatter";

type BrandProductGridProps = {
  products: Product[];
  brand: { price_range?: string; location?: string; currency?: string } | null;
};

/** Everything the designer sells, as a grid of product cards. */
export function BrandProductGrid({ products, brand }: BrandProductGridProps) {
  if (products.length === 0) return null;

  return (
    <section
      id="products"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8"
    >
      <h2 className="font-canela text-2xl text-oma-black sm:text-3xl">
        Pieces
      </h2>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => {
          const image = getProductMainImage(product);
          const price = formatProductPrice(product, brand);
          return (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="group block focus-visible:outline-none"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-oma-beige/60 ring-1 ring-oma-gold/10 transition-shadow group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-oma-plum/50">
                {image && (
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                )}
              </div>
              <h3 className="mt-3 truncate font-canela text-lg text-oma-black">
                {product.title}
              </h3>
              <p className="mt-1 text-sm text-oma-cocoa/80">
                {price.displayPrice}
                {price.originalPrice && (
                  <span className="ml-2 text-oma-cocoa/50 line-through">
                    {price.originalPrice}
                  </span>
                )}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
