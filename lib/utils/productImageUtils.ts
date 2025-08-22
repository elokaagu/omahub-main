import { Product } from "@/lib/supabase";

/**
 * Normalize product images to ensure consistency between main image and images array
 * Maintains the main image field as the primary display image
 */
export function normalizeProductImage<T extends Product>(product: T): T {
  if (!product) return product;

  // If main image is not set but images array has content, use the first image
  if (!product.image && product.images && product.images.length > 0) {
    const firstImage = product.images[0];
    if (firstImage) {
      return {
        ...product,
        image: firstImage,
      };
    }
  }

  return product;
}

/**
 * Get the main display image for a product
 * Prioritizes the main image field for consistency with product page display
 */
export function getProductMainImage(product: Product): string {
  if (!product) return "";

  // Prioritize the main image field for consistency
  if (product.image) {
    return product.image;
  }

  // Fallback to the first image from images array if main image is not available
  if (product.images && product.images.length > 0) {
    const firstImage = product.images[0];
    if (firstImage) {
      return firstImage;
    }
  }

  return "";
}

/**
 * Normalize an array of products to ensure consistent image display
 */
export function normalizeProductImages<T extends Product>(products: T[]): T[] {
  if (!products || !Array.isArray(products)) return [];

  return products.map(normalizeProductImage);
}
