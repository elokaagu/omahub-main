import { NextRequest, NextResponse } from "next/server";

/**
 * API route to fetch page views from Vercel Analytics
 * Requires VERCEL_ACCESS_TOKEN and VERCEL_TEAM_ID environment variables
 */
export async function GET(request: NextRequest) {
  try {
    const accessToken = process.env.VERCEL_ACCESS_TOKEN;
    const teamId = process.env.VERCEL_TEAM_ID;
    const projectId = process.env.VERCEL_PROJECT_ID;

    if (!accessToken) {
      console.warn("VERCEL_ACCESS_TOKEN not configured");
      return NextResponse.json({
        pageViews: null,
        message: "Vercel Analytics not configured. Using estimated page views.",
        source: "estimated",
      });
    }

    // Get the last 30 days of analytics data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const params = new URLSearchParams({
      since: startDate.toISOString(),
      until: endDate.toISOString(),
      ...(teamId && { teamId }),
      ...(projectId && { projectId }),
    });

    // Fetch analytics data from Vercel API
    const response = await fetch(
      `https://api.vercel.com/v1/analytics/pageviews?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Vercel Analytics API error:", response.status, errorText);

      return NextResponse.json({
        pageViews: null,
        message: `Vercel Analytics API error: ${response.status}`,
        source: "estimated",
      });
    }

    const data = await response.json();

    // Sum up all page views from the response
    const totalPageViews =
      data.pageviews?.reduce(
        (total: number, entry: any) => total + (entry.count || 0),
        0
      ) || 0;

    console.log("✅ Fetched Vercel Analytics data:", {
      totalPageViews,
      period: "30 days",
      entries: data.pageviews?.length || 0,
    });

    return NextResponse.json({
      pageViews: totalPageViews,
      message: "Real page views from Vercel Analytics",
      source: "vercel",
      period: "30 days",
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching Vercel analytics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch analytics data",
        pageViews: null,
        source: "estimated",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
