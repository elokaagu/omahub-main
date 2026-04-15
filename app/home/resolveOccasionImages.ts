import { occasionToCategoryMapping } from "@/lib/data/directory";

export const OCCASION_FALLBACKS = {
  Wedding: "/lovable-uploads/57cc6a40-0f0d-4a7d-8786-41f15832ebfb.png",
  Party: "/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png",
  "Ready to Wear":
    "/lovable-uploads/99ca757a-bed8-422e-b155-0b9d365b58e0.png",
  Vacation: "/lovable-uploads/25c3fe26-3fc4-43ef-83ac-6931a74468c0.png",
} as const;

type BrandRow = {
  id: string;
  brand_images?: { storage_path: string }[] | null;
  video_url?: string | null;
};

/**
 * Same selection rules as the former HomeContent client loop, but stable
 * iteration order matches `occasionToCategoryMapping` key order.
 */
export function resolveOccasionImages(
  lists: Array<{ occasion: string; brands: BrandRow[] }>,
  supabasePublicUrl: string
): Record<string, string> {
  const byOccasion = new Map(lists.map((e) => [e.occasion, e.brands]));
  const usedBrandIds = new Set<string>();
  const out: Record<string, string> = {};

  for (const occasion of Object.keys(
    occasionToCategoryMapping
  ) as (keyof typeof occasionToCategoryMapping)[]) {
    const brands = byOccasion.get(occasion) ?? [];
    const availableBrands = brands.filter((b) => {
      if (usedBrandIds.has(b.id)) return false;
      const hasImage = b.brand_images && b.brand_images.length > 0;
      const hasVideo = b.video_url && b.video_url.trim() !== "";
      return hasImage || hasVideo;
    });

    const fallback =
      OCCASION_FALLBACKS[occasion as keyof typeof OCCASION_FALLBACKS];

    if (availableBrands.length > 0) {
      const pick =
        availableBrands[Math.floor(Math.random() * availableBrands.length)];
      usedBrandIds.add(pick.id);
      const path = pick.brand_images?.[0]?.storage_path;
      out[occasion] = path
        ? `${supabasePublicUrl}/storage/v1/object/public/brand-assets/${path}`
        : fallback;
    } else {
      out[occasion] = fallback;
    }
  }

  return out;
}
