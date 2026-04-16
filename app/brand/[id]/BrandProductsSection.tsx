"use client";

import { NavigationLink } from "@/components/ui/navigation-link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LazyImage } from "@/components/ui/lazy-image";
import { ShoppingBag } from "lucide-react";
import { getProductMainImage } from "@/lib/utils/productImageUtils";
import { formatProductPrice } from "@/lib/utils/priceFormatter";
import type { Product } from "@/lib/supabase";
import type { BrandProfileData, BrandProduct } from "./types";

interface BrandProductsSectionProps {
  showAllProducts: boolean;
  productsLoading: boolean;
  products: BrandProduct[];
  brandData: BrandProfileData;
}

export function BrandProductsSection({
  showAllProducts,
  productsLoading,
  products,
  brandData,
}: BrandProductsSectionProps) {
  if (!showAllProducts) {
    return null;
  }

  return (
    <div
      id="products-section"
      className="my-8 sm:my-12 slide-up scroll-mt-20 sm:scroll-mt-24"
      style={{ animationDelay: "50ms" }}
    >
      <h2 className="text-2xl sm:text-3xl font-canela font-normal mb-4 sm:mb-6">
        All Products
      </h2>
      {productsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2 sm:space-y-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-3 sm:h-4 w-3/4" />
              <Skeleton className="h-3 sm:h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-8 sm:py-12 text-gray-500">
          <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-oma-cocoa/30 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base">No products available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {products.map((product, index) => (
            <NavigationLink
              key={product.id}
              href={`/product/${product.id}`}
              className="group block"
            >
              <div
                className="overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg animate-[fadeIn_500ms_ease-in-out_forwards] opacity-0"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="aspect-square relative overflow-hidden">
                  <LazyImage
                    src={
                      getProductMainImage(product as Product) ||
                      "/placeholder.png"
                    }
                    alt={(product.title as string) || "Product"}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    priority={true}
                    aspectRatio="square"
                    quality={85}
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                  <div className="absolute left-2.5 top-2.5">
                    <Badge
                      variant="secondary"
                      className="border border-white/25 bg-black/35 text-[11px] text-white backdrop-blur-sm"
                    >
                      {(product.category as string) || "Product"}
                    </Badge>
                  </div>
                  {product.service_type !== "portfolio" && (
                    <div className="absolute right-2.5 top-2.5">
                      <Badge
                        variant="secondary"
                        className={`text-[11px] ${
                          product.in_stock
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-oma-cocoa/70 text-white"
                        }`}
                      >
                        {product.in_stock ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-3.5 sm:p-4">
                  <h3 className="line-clamp-1 text-base font-semibold sm:text-lg group-hover:text-oma-plum transition-colors">
                    {product.title as string}
                  </h3>
                  <div className="flex items-center justify-between gap-2">
                    {product.service_type === "portfolio" ? (
                      <p className="text-sm text-oma-cocoa/70">Portfolio item</p>
                    ) : (
                      <p className="text-xl font-canela text-oma-plum tabular-nums sm:text-[1.7rem] leading-none">
                        {
                          formatProductPrice(product as any, {
                            price_range: brandData.priceRange,
                            currency: brandData.currency,
                            location: brandData.location,
                          }).displayPrice
                        }
                      </p>
                    )}
                    <span className="text-xs text-oma-cocoa/70">View details</span>
                  </div>
                </div>
              </div>
            </NavigationLink>
          ))}
        </div>
      )}
    </div>
  );
}
