import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import {
  fetchGa4Last30DayPageViews,
  parseServiceAccountKey,
} from "@/lib/integrations/google-analytics-admin";

export const dynamic = "force-dynamic";

/**
 * Site-wide GA4 page views (last 30 days). Super-admin only; cookies required.
 * Env: GOOGLE_ANALYTICS_PROPERTY_ID, GOOGLE_SERVICE_ACCOUNT_KEY (JSON).
 */
export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!propertyId || !serviceAccountKey) {
      console.warn("Google Analytics credentials not configured");
      return NextResponse.json({
        pageViews: null,
        message: "Google Analytics not configured. Using estimated page views.",
        source: "estimated",
      });
    }

    const credentials = parseServiceAccountKey(serviceAccountKey);
    if (!credentials) {
      console.error("Invalid GOOGLE_SERVICE_ACCOUNT_KEY shape");
      return NextResponse.json({
        pageViews: null,
        message: "Invalid Google Analytics credentials format.",
        source: "estimated",
      });
    }

    const result = await fetchGa4Last30DayPageViews(propertyId, credentials);

    if (!result.ok) {
      return NextResponse.json({
        pageViews: result.pageViews,
        message: result.message,
        source: result.source,
      });
    }

    if (process.env.NODE_ENV === "development") {
      console.log("Fetched Google Analytics page views (30d)", {
        totalPageViews: result.pageViews,
      });
    }

    return NextResponse.json({
      pageViews: result.pageViews,
      message: "Real page views from Google Analytics",
      source: result.source,
      period: result.period,
      lastUpdated: result.lastUpdated,
    });
  } catch (error) {
    console.error("Error fetching Google Analytics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch Google Analytics data",
        pageViews: null,
        source: "estimated",
        message: "An unexpected error occurred while loading analytics.",
      },
      { status: 500 }
    );
  }
}
