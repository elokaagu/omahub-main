import { NextRequest, NextResponse } from "next/server";
import { searchBrands } from "@/lib/services/brandService";

export const dynamic = "force-dynamic";

/** Server-side brand text search (includes unapproved-application filtering). */
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (!q) {
      return NextResponse.json({ brands: [] });
    }
    const brands = await searchBrands(q);
    return NextResponse.json({ brands });
  } catch (error) {
    console.error("GET /api/brands/search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
