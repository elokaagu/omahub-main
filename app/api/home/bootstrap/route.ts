import { NextResponse } from "next/server";
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

export const dynamic = "force-dynamic";

/**
 * Aggregates all homepage data in one server round-trip (parallel I/O).
 * CDN caches the JSON; data freshness follows brand/product TTLs on the server.
 */
export async function GET() {
  try {
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

    const dynamicFallbackItems =
      buildCarouselFallbackFromCataloguesAndTailors(
        catalogueImages,
        tailorImages
      );

    const categoryImages = pickCategoryImagesFromSources(
      catalogueImages,
      tailorImages
    );

    const occasionImages = resolveOccasionImages(
      occasionBrandLists,
      supabaseUrl
    );

    const res = NextResponse.json({
      categories,
      heroSlides,
      spotlightContent,
      dynamicFallbackItems,
      categoryImages,
      occasionImages,
    });

    res.headers.set(
      "Cache-Control",
      "public, s-maxage=120, stale-while-revalidate=300"
    );
    res.headers.set("CDN-Cache-Control", "public, s-maxage=120");
    res.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=120");

    return res;
  } catch (e) {
    console.error(
      JSON.stringify({
        event: "home_bootstrap_error",
        message: e instanceof Error ? e.message : String(e),
      })
    );
    return NextResponse.json(
      { error: "Failed to load homepage data" },
      { status: 500 }
    );
  }
}
