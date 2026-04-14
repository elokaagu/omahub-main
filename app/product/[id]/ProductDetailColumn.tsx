"use client";

import type { Product, Brand } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NavigationLink } from "@/components/ui/navigation-link";
import { TailoredOrderModal } from "@/components/product/TailoredOrderModal";
import {
  Ruler,
  Clock,
  MapPin,
  CheckCircle,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatProductPrice } from "@/lib/utils/priceFormatter";
import AddToBasketButton from "@/components/ui/add-to-basket-button";
import { FavouriteButton } from "@/components/ui/favourite-button";
import { splitProductDescription } from "@/lib/product/productDescription";

interface ProductDetailColumnProps {
  product: Product;
  brand: Brand;
  showOrderModal: boolean;
  onOpenOrderModal: () => void;
  onCloseOrderModal: () => void;
}

export function ProductDetailColumn({
  product,
  brand,
  showOrderModal,
  onOpenOrderModal,
  onCloseOrderModal,
}: ProductDetailColumnProps) {
  const paragraphs = splitProductDescription(product.description);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <NavigationLink href={`/brand/${brand.id}`}>
          <div className="flex items-center gap-2 transition-colors hover:text-oma-plum">
            <span className="font-medium">{brand.name}</span>
            {brand.is_verified && (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
          </div>
        </NavigationLink>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <MapPin className="h-3 w-3" />
          {brand.location}
        </div>
      </div>

      <div>
        <h1 className="mb-2 font-canela text-3xl text-gray-900">
          {product.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            {product.service_type === "portfolio" ? (
              <div />
            ) : (
              <>
                <span className="text-2xl font-bold text-oma-plum">
                  {formatProductPrice(product, brand).displayPrice}
                </span>
                {product.sale_price && (
                  <span className="text-lg text-gray-500 line-through">
                    {formatProductPrice(product, brand).originalPrice}
                  </span>
                )}
              </>
            )}
          </div>
          {product.service_type !== "portfolio" && (
            <Badge
              variant="secondary"
              className={cn(
                "text-xs",
                product.in_stock
                  ? "bg-oma-gold text-oma-cocoa hover:bg-oma-gold/90 hover:text-oma-cocoa"
                  : "bg-oma-cocoa/40 text-white hover:bg-oma-cocoa/50"
              )}
            >
              {product.in_stock ? "In Stock" : "Out of Stock"}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="mb-2 font-semibold text-gray-900">Description</h3>
          <div className="prose max-w-none text-oma-black">
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, i) => (
                <p key={i} className="mb-4 leading-relaxed text-gray-600">
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="text-gray-500">No description provided.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="mb-1 font-medium text-gray-900">Category</h4>
            <Badge variant="outline">{product.category}</Badge>
          </div>

          {product.materials && product.materials.length > 0 && (
            <div>
              <h4 className="mb-1 font-medium text-gray-900">Materials</h4>
              <div className="flex flex-wrap gap-1">
                {product.materials.map((material, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {material}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {product.sizes && product.sizes.length > 0 && (
            <div>
              <h4 className="mb-1 font-medium text-gray-900">
                Available Sizes
              </h4>
              <div className="flex flex-wrap gap-1">
                {product.sizes.map((size, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {size}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {product.colors && product.colors.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-oma-cocoa">Available Colours</h4>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="border-oma-plum text-oma-plum"
                  >
                    {color}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {product.is_custom && (
          <div className="rounded-lg bg-oma-beige/30 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Ruler className="h-5 w-5 text-oma-plum" />
              <h4 className="font-semibold text-gray-900">
                Custom Tailored Available
              </h4>
            </div>
            <p className="mb-2 text-sm text-gray-600">
              This piece can be custom tailored to your exact measurements.
            </p>
            {product.lead_time && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Lead time: {product.lead_time}</span>
              </div>
            )}
          </div>
        )}

        {product.care_instructions && (
          <div>
            <h4 className="mb-1 font-medium text-gray-900">
              Care Instructions
            </h4>
            <p className="text-sm text-gray-600">{product.care_instructions}</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {product.is_custom ? (
          <Button
            onClick={onOpenOrderModal}
            disabled={!product.in_stock}
            className="w-full bg-oma-plum py-3 text-white hover:bg-oma-plum/90"
            size="lg"
          >
            <Ruler className="mr-2 h-5 w-5" />
            Order Custom Piece
          </Button>
        ) : (
          <AddToBasketButton
            productId={product.id}
            productName={product.title}
            productImage={product.image}
            price={product.sale_price || product.price}
            brandId={product.brand_id}
            brandName={brand.name}
            brandCurrency={brand.currency}
            sizes={product.sizes}
            colors={product.colors}
            className="w-full py-3"
          />
        )}

        <FavouriteButton
          itemId={product.id}
          itemType="product"
          className="w-full"
        />
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Brand Rating:</span>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{brand.rating}</span>
          </div>
        </div>
      </div>

      {showOrderModal && (
        <TailoredOrderModal
          product={product}
          brand={brand}
          isOpen={showOrderModal}
          onClose={onCloseOrderModal}
        />
      )}
    </div>
  );
}
