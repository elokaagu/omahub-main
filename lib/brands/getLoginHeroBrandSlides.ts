import { getAllBrands } from "@/lib/services/brandService";
import type { Brand } from "@/lib/supabase";
import {
  brandIsListedInPublicDirectory,
  resolveBrandDirectoryCardImageUrl,
} from "@/lib/brands/directoryListingImage";

export type LoginHeroSlide = {
  brandId: string;
  brandName: string;
  imageUrl: string;
};

/** Stable-ish ordering so SSR output is not random per request (better caching). */
function sortKeyForBrand(b: Brand): string {
  const r = typeof b.rating === "number" ? b.rating : 0;
  return `${String(r).padStart(4, "0")}:${(b.name ?? "").toLowerCase()}`;
}

/**
 * Public directory–eligible brands with real cover art, for the login hero carousel.
 */
export async function getLoginHeroBrandSlides(
  maxSlides = 14
): Promise<LoginHeroSlide[]> {
  try {
    const brands = await getAllBrands(false, false);
    const listed = brands
      .filter(brandIsListedInPublicDirectory)
      .sort((a, b) => sortKeyForBrand(b).localeCompare(sortKeyForBrand(a)));

    const slides: LoginHeroSlide[] = [];
    const seenUrls = new Set<string>();

    for (const b of listed) {
      const imageUrl = resolveBrandDirectoryCardImageUrl(b);
      if (!imageUrl || seenUrls.has(imageUrl)) continue;
      seenUrls.add(imageUrl);
      slides.push({
        brandId: b.id,
        brandName: (b.name ?? "Brand").trim() || "Brand",
        imageUrl,
      });
      if (slides.length >= maxSlides) break;
    }

    return slides;
  } catch (e) {
    console.error("getLoginHeroBrandSlides:", e);
    return [];
  }
}
