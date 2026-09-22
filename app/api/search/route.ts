import { NextRequest, NextResponse } from "next/server";
import { PUBLIC_CDN_CACHE_HEADERS } from "@/lib/http/cacheHeaders";
import { normaliseSearchQuery } from "@/lib/search/searchQuery";
import { searchSite } from "@/lib/search/siteSearch";
import type { SearchResponse } from "@/lib/search/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/search?q= - site-wide search for the header search dialog.
 * Results are public and identical for every visitor, so they're cached
 * briefly at the edge.
 */
export async function GET(request: NextRequest) {
  const query = normaliseSearchQuery(request.nextUrl.searchParams.get("q"));
  if (!query) {
    return NextResponse.json<SearchResponse>({ query: "", groups: [] });
  }

  try {
    const results = await searchSite(query);
    return NextResponse.json(results, { headers: PUBLIC_CDN_CACHE_HEADERS });
  } catch (error) {
    console.error("GET /api/search:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
