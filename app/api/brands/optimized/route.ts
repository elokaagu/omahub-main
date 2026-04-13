import { NextRequest, NextResponse } from "next/server";
import { performanceService } from "@/lib/services/performanceService";
import { parseBrandsOptimizedQuery } from "@/lib/validation/brandsOptimizedQuery";

/**
 * Public brand listing with bounded query params and CDN-friendly caching when
 * in-memory cache is enabled. `revalidate` is omitted: this handler is always
 * dynamic per URL; freshness is controlled via Cache-Control + service TTL.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const parsed = parseBrandsOptimizedQuery(request.nextUrl.searchParams);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { category, limit, fields, useCache } = parsed.value;

    const brands = await performanceService.measurePerformance(
      () =>
        performanceService.getBrandsOptimized({
          category,
          limit,
          fields,
          useCache,
        }),
      "Optimized brands fetch"
    );

    const response = NextResponse.json({
      brands,
      count: brands.length,
      cached: useCache,
    });

    if (useCache) {
      response.headers.set(
        "Cache-Control",
        "public, s-maxage=300, stale-while-revalidate=600"
      );
      response.headers.set("CDN-Cache-Control", "public, s-maxage=300");
      response.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=300");
    } else {
      response.headers.set(
        "Cache-Control",
        "private, no-store, must-revalidate"
      );
    }

    return response;
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "brands_optimized_api_error",
        message: error instanceof Error ? error.message : String(error),
      })
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
