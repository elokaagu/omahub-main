import { NextRequest, NextResponse } from "next/server";
import {
  clearBrandsCache,
  getAllBrands,
  getBrandsByCategory,
} from "@/lib/services/brandService";

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

    if (category) {
      const brands = await getBrandsByCategory(category);
      return NextResponse.json({ brands });
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
      });
    }

    return NextResponse.json({ brands });
  } catch (error) {
    console.error("GET /api/brands/public:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
