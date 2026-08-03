import type { SupabaseClient } from "@supabase/supabase-js";

/** Public URL prefix for files uploaded during designer applications. */
export function brandAssetsPublicUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/brand-assets/${storagePath}`;
}

/**
 * `brand_images.storage_path` is relative to the brand-assets bucket.
 * Application photos are uploaded as full public URLs — strip back to the path.
 */
export function extractBrandAssetsStoragePath(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const bases = [
    process.env.SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ].filter(Boolean) as string[];

  for (const base of bases) {
    const prefix = `${base}/storage/v1/object/public/brand-assets/`;
    if (trimmed.startsWith(prefix)) {
      return trimmed.slice(prefix.length);
    }
  }

  // Already a relative storage path (no protocol).
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return trimmed.replace(/^\/+/, "");
  }

  return null;
}

export type BrandImageRowInput = {
  brand_id: string;
  role: string;
  storage_path: string;
};

/** Build `brand_images` rows from designer-application photo URLs. */
export function buildBrandImageRowsFromApplicationUrls(
  brandId: string,
  imageUrls: string[],
): BrandImageRowInput[] {
  return imageUrls
    .map((url, index) => ({
      brand_id: brandId,
      role: index === 0 ? "cover" : "gallery",
      storage_path: extractBrandAssetsStoragePath(url),
    }))
    .filter((row): row is BrandImageRowInput => Boolean(row.storage_path));
}

type BrandImageRecord = {
  id: string;
  role: string | null;
};

/**
 * On approval, copy applicant photos into `brand_images` so the public profile,
 * directory card, and products fallback all use the same cover the designer uploaded.
 */
export async function syncApplicationPhotosToBrandImages(
  supabase: SupabaseClient,
  brandId: string,
  imageUrls: string[] | null | undefined,
): Promise<void> {
  if (!imageUrls?.length) return;

  const rows = buildBrandImageRowsFromApplicationUrls(brandId, imageUrls);
  if (rows.length === 0) return;

  const { data: existing, error: fetchError } = await supabase
    .from("brand_images")
    .select("id, role")
    .eq("brand_id", brandId);

  if (fetchError) {
    console.warn("⚠️ Failed to read brand_images for sync:", fetchError);
    return;
  }

  const existingRows = (existing ?? []) as BrandImageRecord[];
  const hasCover = existingRows.some((row) => row.role === "cover");

  if (existingRows.length === 0) {
    const { error: insertError } = await supabase.from("brand_images").insert(rows);
    if (insertError) {
      console.warn("⚠️ Failed to copy application photos to brand_images:", insertError);
    }
    return;
  }

  if (!hasCover && rows[0]) {
    const { error: insertCoverError } = await supabase
      .from("brand_images")
      .insert([rows[0]]);
    if (insertCoverError) {
      console.warn("⚠️ Failed to insert application cover photo:", insertCoverError);
    }
  }
}

/** First usable application photo URL (full public URL). */
export function getPrimaryApplicationImageUrl(
  imageUrls: string[] | null | undefined,
): string | undefined {
  if (!imageUrls?.length) return undefined;
  return imageUrls.find((url) => url.trim().length > 0)?.trim();
}
