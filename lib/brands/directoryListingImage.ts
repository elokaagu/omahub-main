import type { Brand } from "@/lib/supabase";
import { brandAssetsPublicUrl } from "@/lib/brands/applicationBrandImages";

/** Shown in BrandCard when there is no Supabase asset or valid legacy URL. */
export const DIRECTORY_LISTING_FALLBACK_LOGO = "/brand/omahub-logo.png";

const BROKEN_IMAGE_FALLBACKS = new Set([
  "",
  "/placeholder.jpg",
  "/placeholder-image.jpg",
  "/placeholder.png",
  "/placeholder.svg",
]);

type BrandImageLike = {
  role?: string | null;
  storage_path?: string | null;
};

/** True when `url` is non-empty and not a known placeholder (legacy `brands.image`, logos, etc.). */
export function isUsableBrandCardImageUrl(url: string | null | undefined): boolean {
  const t = url?.trim() ?? "";
  return t.length > 0 && !BROKEN_IMAGE_FALLBACKS.has(t);
}

function storagePathToPublicUrl(path: string | null | undefined): string | null {
  const trimmed = path?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return isUsableBrandCardImageUrl(trimmed) ? trimmed : null;
  }
  const url = brandAssetsPublicUrl(trimmed);
  return isUsableBrandCardImageUrl(url) ? url : null;
}

/** Prefer the application cover photo, then any synced brand image. */
export function pickPrimaryBrandImageUrl(
  brandImages: BrandImageLike[] | null | undefined,
): string | null {
  if (!brandImages?.length) return null;

  const cover = brandImages.find((img) => img.role === "cover");
  const coverUrl = storagePathToPublicUrl(cover?.storage_path);
  if (coverUrl) return coverUrl;

  for (const img of brandImages) {
    const url = storagePathToPublicUrl(img.storage_path);
    if (url) return url;
  }

  return null;
}

/**
 * Profile / directory image: application cover in `brand_images`, then legacy
 * `brands.image` (often the first application URL saved on approval).
 */
export function resolveBrandDirectoryCardImageUrl(brand: Brand): string {
  const fromBrandImages = pickPrimaryBrandImageUrl(brand.brand_images);
  if (fromBrandImages) return fromBrandImages;

  const fromApi = brand.image?.trim() ?? "";
  if (isUsableBrandCardImageUrl(fromApi)) {
    return fromApi;
  }

  const fromLogo = brand.logo_url?.trim() ?? "";
  if (isUsableBrandCardImageUrl(fromLogo)) {
    return fromLogo;
  }

  const fromVideo = brand.video_thumbnail?.trim() ?? "";
  if (isUsableBrandCardImageUrl(fromVideo)) {
    return fromVideo;
  }

  return DIRECTORY_LISTING_FALLBACK_LOGO;
}

/** Profile image URL when application photos are available but not yet synced. */
export function resolveBrandProfileImageUrl(
  brand: Brand,
  applicationImageUrls?: string[] | null,
): string | undefined {
  const resolved = resolveBrandDirectoryCardImageUrl(brand);
  if (isUsableBrandCardImageUrl(resolved) && resolved !== DIRECTORY_LISTING_FALLBACK_LOGO) {
    return resolved;
  }

  const fromApplication = applicationImageUrls
    ?.map((url) => url.trim())
    .find(isUsableBrandCardImageUrl);

  return fromApplication || undefined;
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
