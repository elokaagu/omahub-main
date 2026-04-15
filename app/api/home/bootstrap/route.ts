import { NextResponse } from "next/server";
import { getHomeBootstrapPayload } from "@/lib/home/getHomeBootstrapPayload";

export const revalidate = 120;

/**
 * Aggregates all homepage data in one server round-trip (parallel I/O).
 * Body matches `getHomeBootstrapPayload` (Next.js cache, 120s).
 */
export async function GET() {
  try {
    const payload = await getHomeBootstrapPayload();

    const res = NextResponse.json(payload);

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
