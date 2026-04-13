import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { getAnalyticsData } from "@/lib/services/analyticsService";

export const dynamic = "force-dynamic";

/**
 * Platform analytics for super-admins only. Uses the caller’s server session for DB queries.
 * Dashboard code typically calls `getAnalyticsData()` from the client instead of this route.
 */
export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const data = await getAnalyticsData(auth.supabase);
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/analytics failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch platform analytics" },
      { status: 500 }
    );
  }
}
