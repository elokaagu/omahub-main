import { NextRequest, NextResponse } from "next/server";
import { performanceService } from "@/lib/services/performanceService";

// Force dynamic rendering since we use request.url
export const dynamic = 'force-dynamic';

// Cache for 5 minutes
export const revalidate = 300;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "20");
    const fields = searchParams.get("fields")?.split(",") || undefined;
    const useCache = searchParams.get("cache") !== "false";

    // Validate limit
    if (limit > 100) {
      return NextResponse.json(
        { error: "Limit cannot exceed 100" },
        { status: 400 }
      );
    }

    // Measure performance
    const brands = await performanceService.measurePerformance(
      () =>
        performanceService.getBrandsOptimized({
          category: category || undefined,
          limit,
          fields,
          useCache,
        }),
      "Optimized brands fetch"
    );

    // Add cache headers
    const response = NextResponse.json({
      brands,
      count: brands.length,
      cached: useCache,
    });

    // Set cache headers
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );
    response.headers.set("CDN-Cache-Control", "public, s-maxage=300");
    response.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=300");

    return response;
  } catch (error) {
    console.error("Error in optimized brands API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
