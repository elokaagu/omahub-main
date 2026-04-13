import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { fetchVercelPageviewsLast30Days } from "@/lib/integrations/vercel-analytics-pageviews";

export const dynamic = "force-dynamic";

/**
 * Site-wide Vercel Analytics pageviews (last 30 days). Super-admin only.
 * Env: VERCEL_ACCESS_TOKEN; optional VERCEL_TEAM_ID, VERCEL_PROJECT_ID.
 */
export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const result = await fetchVercelPageviewsLast30Days();

    if (!result.ok) {
      return NextResponse.json({
        pageViews: result.pageViews,
        message: result.message,
        source: result.source,
      });
    }

    if (process.env.NODE_ENV === "development") {
      console.log("Vercel Analytics page views (30d)", {
        totalPageViews: result.pageViews,
        entries: result.entryCount,
      });
    }

    return NextResponse.json({
      pageViews: result.pageViews,
      message: "Real page views from Vercel Analytics",
      source: result.source,
      period: result.period,
      lastUpdated: result.lastUpdated,
    });
  } catch (error) {
    console.error("Error fetching Vercel analytics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch analytics data",
        pageViews: null,
        source: "estimated",
        message: "An unexpected error occurred while loading analytics.",
      },
      { status: 500 }
    );
  }
}
