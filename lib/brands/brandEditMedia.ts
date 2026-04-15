import type { Brand } from "@/lib/supabase";

const BRAND_ASSETS_BUCKET = "brand-assets";

/** Public URL for the first brand_images row, or empty string. */
export function getPrimaryBrandImagePublicUrl(brand: Brand | null): string {
  if (!brand?.brand_images?.[0]?.storage_path) {
    return "";
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return "";
  return `${base}/storage/v1/object/public/${BRAND_ASSETS_BUCKET}/${brand.brand_images[0].storage_path}`;
}

/** Single place to derive preview URLs from brand + pending upload URL. */
export function getBrandEditMediaViewModel(
  brand: Brand | null,
  pendingPrimaryImageUrl: string
) {
  const primaryFromBrand = getPrimaryBrandImagePublicUrl(brand);
  const primaryImageUrl = pendingPrimaryImageUrl || primaryFromBrand;
  return {
    primaryFromBrand,
    primaryImageUrl,
    videoUrl: brand?.video_url ?? "",
    videoThumbnailUrl: brand?.video_thumbnail ?? "",
  };
}
