import { NextRequest, NextResponse } from "next/server";
import {
  clearBrandsCache,
  getAllBrands,
  getBrandsByCategory,
} from "@/lib/services/brandService";
import {
  NO_STORE_HEADERS,
  PUBLIC_CDN_CACHE_HEADERS,
} from "@/lib/http/cacheHeaders";

export const dynamic = "force-dynamic";

/**
 * Server-only brand lists for the browser: applies service-role filtering
 * (e.g. unapproved applications) that cannot run in the client.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const refresh = searchParams.get("refresh") === "1";
    const filterEmpty = searchParams.get("filterEmpty") === "1";
    const categoryRaw = searchParams.get("category");
    const category = categoryRaw?.trim() ?? "";

    if (refresh) {
      clearBrandsCache();
    }
    // A forced refresh must not be served from (or stored in) the CDN cache.
    const headers = refresh ? NO_STORE_HEADERS : PUBLIC_CDN_CACHE_HEADERS;

    if (category) {
      const brands = await getBrandsByCategory(category);
      return NextResponse.json({ brands }, { headers });
    }

    const brands = await getAllBrands(filterEmpty, refresh);

    // `?fields=card`: just what a brand card / picker renders, instead of
    // every column (long descriptions, contact details, etc.).
    if (searchParams.get("fields") === "card") {
      return NextResponse.json({
        brands: brands.map((b) => ({
          id: b.id,
          name: b.name,
          image: b.image,
          category: b.category,
          location: b.location,
          is_verified: b.is_verified,
          rating: b.rating,
          video_url: b.video_url,
          video_thumbnail: b.video_thumbnail,
        })),
      }, { headers });
    }

    return NextResponse.json({ brands }, { headers });
  } catch (error) {
    console.error("GET /api/brands/public:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
