import { unstable_cache } from "next/cache";
import { occasionToCategoryMapping } from "@/lib/data/directory";
import { UNIFIED_CATEGORIES } from "@/lib/data/unified-categories";
import { buildHomepageCategoriesFromBrands } from "@/app/home/buildHomepageCategories";
import {
  buildCarouselFallbackFromCataloguesAndTailors,
  pickCategoryImagesFromSources,
} from "@/app/home/homepageData";
import { resolveOccasionImages } from "@/app/home/resolveOccasionImages";
import { getAllBrands, getBrandsByCategory } from "@/lib/services/brandService";
import { getCollectionsWithBrands } from "@/lib/services/collectionService";
import { getActiveHeroSlides } from "@/lib/services/heroService";
import { getProductsByCategories } from "@/lib/services/productSearchService";
import { getActiveSpotlightContent } from "@/lib/services/spotlightService";
import { getTailorsWithBrands } from "@/lib/services/tailorService";
import type { HomeBootstrapPayload } from "@/lib/home/homeBootstrapTypes";

async function buildHomeBootstrapPayload(): Promise<HomeBootstrapPayload> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  const [
    brandsData,
    heroSlides,
    spotlightContent,
    catalogues,
    tailors,
    categoryProducts,
    occasionBrandLists,
  ] = await Promise.all([
    getAllBrands(false, false),
    getActiveHeroSlides(),
    getActiveSpotlightContent(),
    getCollectionsWithBrands(),
    getTailorsWithBrands(),
    Promise.all(
      UNIFIED_CATEGORIES.map((category) =>
        getProductsByCategories([category.name]).then((products) => ({
          categoryId: category.id,
          products,
        }))
      )
    ),
    Promise.all(
      Object.entries(occasionToCategoryMapping).map(
        async ([occasion, category]) => ({
          occasion,
          brands: await getBrandsByCategory(category),
        })
      )
    ),
  ]);

  const categories = buildHomepageCategoriesFromBrands(
    brandsData,
    categoryProducts
  );

  const catalogueImages = catalogues.map((c) => ({ image: c.image }));
  const tailorImages = tailors.map((t) => ({ image: t.image }));

  const dynamicFallbackItems = buildCarouselFallbackFromCataloguesAndTailors(
    catalogueImages,
    tailorImages
  );

  const categoryImages = pickCategoryImagesFromSources(
    catalogueImages,
    tailorImages
  );

  const occasionImages = resolveOccasionImages(occasionBrandLists, supabaseUrl);

  return {
    categories,
    heroSlides,
    spotlightContent,
    dynamicFallbackItems,
    categoryImages,
    occasionImages,
  };
}

/**
 * Cached homepage bootstrap (120s). Shared by `app/page.tsx` (ISR) and `/api/home/bootstrap`.
 */
export const getHomeBootstrapPayload = unstable_cache(
  buildHomeBootstrapPayload,
  ["home-bootstrap-v1"],
  { revalidate: 120, tags: ["home-bootstrap"] }
);
