import { cache } from "react";
import { getProductById } from "@/lib/services/productService";
import { getBrandById } from "@/lib/services/brandService";
import type { Product, Brand } from "@/lib/supabase";

export type ProductWithBrand = { product: Product; brand: Brand };

/**
 * Single request-scoped load for product + brand (dedupes between
 * `generateMetadata` and the page when both run in the same RSC pass).
 */
export const getCachedProductWithBrand = cache(
  async (productId: string): Promise<ProductWithBrand | null> => {
    const product = await getProductById(productId);
    if (!product) {
      return null;
    }
    const brand = product.brand_id
      ? await getBrandById(product.brand_id)
      : null;
    if (!brand) {
      return null;
    }
    return { product, brand };
  }
);
