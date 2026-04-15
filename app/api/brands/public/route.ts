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
    return NextResponse.json({ brands });
  } catch (error) {
    console.error("GET /api/brands/public:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
