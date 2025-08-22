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
 * Falls back to images array if main image is not available
 */
export function getProductMainImage(product: Product): string {
  if (!product) return "";

  // If main image is available, use it
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
 * Get the best available image for a product
 * This function tries to find the most appropriate image for display
 */
export function getProductBestImage(product: Product): string {
  if (!product) return "";

  // If we have multiple images, try to find the best one
  if (product.images && product.images.length > 0) {
    // Look for images that might be the main product image
    // This is a heuristic approach - you might need to adjust based on your naming conventions
    
    // First, check if any image in the array looks like it might be the main product image
    // (e.g., contains keywords like "main", "primary", "product", etc.)
    const mainImage = product.images.find(img => 
      img.toLowerCase().includes('main') || 
      img.toLowerCase().includes('primary') || 
      img.toLowerCase().includes('product')
    );
    
    if (mainImage) {
      return mainImage;
    }
    
    // If no main image found, use the first image from the array
    return product.images[0];
  }

  // Fallback to the main image field
  if (product.image) {
    return product.image;
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
