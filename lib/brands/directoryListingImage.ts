import type { Brand } from "@/lib/supabase";

/** Shown in BrandCard when there is no Supabase asset or valid legacy URL. */
export const DIRECTORY_LISTING_FALLBACK_LOGO = "/brand/omahub-logo.png";

const BROKEN_IMAGE_FALLBACKS = new Set([
  "",
  "/placeholder.jpg",
  "/placeholder-image.jpg",
  "/placeholder.png",
  "/placeholder.svg",
]);

/** True when `url` is non-empty and not a known placeholder (legacy `brands.image`, logos, etc.). */
export function isUsableBrandCardImageUrl(url: string | null | undefined): boolean {
  const t = url?.trim() ?? "";
  return t.length > 0 && !BROKEN_IMAGE_FALLBACKS.has(t);
}

/**
 * Same resolution rules as the directory / BrandCard image (API `image`, then `brand_images[0]`).
 */
export function resolveBrandDirectoryCardImageUrl(brand: Brand): string {
  const fromApi = brand.image?.trim() ?? "";
  if (fromApi && !BROKEN_IMAGE_FALLBACKS.has(fromApi)) {
    return fromApi;
  }

  const fromLogo = brand.logo_url?.trim() ?? "";
  if (fromLogo && !BROKEN_IMAGE_FALLBACKS.has(fromLogo)) {
    return fromLogo;
  }

  const path = brand.brand_images?.[0]?.storage_path?.trim();
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (path && base) {
    return `${base}/storage/v1/object/public/brand-assets/${path}`;
  }

  return DIRECTORY_LISTING_FALLBACK_LOGO;
}

/**
 * Brands without a published cover image are omitted from `/directory` so cards
 * do not show the “Image Coming Soon” placeholder in the grid.
 */
export function brandIsListedInPublicDirectory(brand: Brand): boolean {
  const url = resolveBrandDirectoryCardImageUrl(brand);
  if (!url || url === DIRECTORY_LISTING_FALLBACK_LOGO) return false;
  if (BROKEN_IMAGE_FALLBACKS.has(url)) return false;
  return true;
}
