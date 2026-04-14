import { Product } from "@/lib/supabase";
import { isImageLikeUrl } from "@/lib/product/mediaUrl";

/**
 * Normalize product images to ensure the first image from the images array
 * is always used as the main image for consistent display
 */
export function normalizeProductImage<T extends Product>(product: T): T {
  if (!product) return product;

  // If product has multiple images, ensure the first one is the main image
  if (product.images && product.images.length > 0) {
    const firstImage = product.images[0];
    if (firstImage && firstImage !== product.image) {
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
 * Always returns the first image from the images array if available
 */
export function getProductMainImage(product: Product): string {
  if (!product) return "";

  // If product has multiple images, use the first one
  if (product.images && product.images.length > 0) {
    const firstImage = product.images[0];
    if (firstImage) {
      return firstImage;
    }
  }

  // Fallback to the main image field
  return product.image || "";
}

/**
 * Image URL for Open Graph / Twitter cards: same priority as gallery stills,
 * then a non-video video thumbnail, then site default.
 */
/** Ordered list of still images for the product gallery (matches main-image priority). */
export function getProductGalleryImageList(product: Product): string[] {
  if (product.images && product.images.length > 0) {
    return product.images;
  }
  if (product.image) {
    return [product.image];
  }
  return [];
}

export function getProductOgImageUrl(product: Product): string {
  const main = getProductMainImage(product);
  if (main && isImageLikeUrl(main)) {
    return main;
  }
  const thumb = product.video_thumbnail;
  if (thumb && isImageLikeUrl(thumb)) {
    return thumb;
  }
  return "/OmaHubBanner.png";
}

/**
 * Normalize an array of products to ensure consistent image display
 */
export function normalizeProductImages<T extends Product>(products: T[]): T[] {
  if (!products || !Array.isArray(products)) return [];

  return products.map(normalizeProductImage);
}
