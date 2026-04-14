"use client";

import Link from "next/link";
import { LazyImage } from "@/components/ui/lazy-image";
import { formatProductPrice } from "@/lib/utils/priceFormatter";
import { getProductMainImage } from "@/lib/utils/productImageUtils";
import { CATALOGUE_IMAGE_OBJECT_CLASS } from "./collectionPageUtils";
import type { CollectionProduct, RecommendedProduct } from "./types";

type CardProduct = CollectionProduct | RecommendedProduct;

function ProductCardInner({ product }: { product: CardProduct }) {
  const mainSrc = getProductMainImage(product) || "/placeholder.png";
  const price = formatProductPrice(
    {
      price: product.price,
      sale_price: product.sale_price,
    },
    product.brand
  );

  return (
    <div className="bg-white/80 rounded-xl overflow-hidden border border-oma-gold/10 hover:border-oma-gold/30 transition-all duration-300 hover:shadow-lg group-hover:-translate-y-1">
      <div className="aspect-square relative overflow-hidden">
        <LazyImage
          src={mainSrc}
          alt={product.title}
          fill
          className={`${CATALOGUE_IMAGE_OBJECT_CLASS} group-hover:scale-105 transition-transform duration-300`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          priority={false}
          aspectRatio="square"
          quality={80}
        />
        {product.sale_price ? (
          <div className="absolute top-3 left-3 bg-oma-plum text-white text-xs px-2 py-1 rounded-full">
            Sale
          </div>
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-black mb-2 group-hover:text-oma-plum transition-colors line-clamp-2">
          {product.title}
        </h3>
        <div className="flex items-center gap-2">
          {product.sale_price ? (
            <>
              <span className="text-lg font-semibold text-oma-plum">
                {price.displayPrice}
              </span>
              <span className="text-sm text-black/60 line-through">
                {price.originalPrice}
              </span>
            </>
          ) : (
            <span className="text-lg font-semibold text-black">
              {price.displayPrice}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function CollectionProductCard({ product }: { product: CollectionProduct }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="group block"
    >
      <ProductCardInner product={product} />
    </Link>
  );
}

export function RecommendationProductCard({ product }: { product: RecommendedProduct }) {
  return (
    <Link href={`/product/${product.id}`} className="group block">
      <ProductCardInner product={product} />
    </Link>
  );
}
