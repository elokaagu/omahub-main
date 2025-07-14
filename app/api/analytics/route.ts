import { NextResponse } from "next/server";
import { getAnalyticsData } from "@/lib/services/analyticsService";

export async function GET() {
  try {
    const data = await getAnalyticsData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch platform analytics" },
      { status: 500 }
    );
  }
}
