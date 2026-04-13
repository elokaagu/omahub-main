import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";
import {
  parseBrandIdsParam,
  assertBrandAnalyticsAccess,
  loadBrandAnalytics,
} from "@/lib/services/brandAnalyticsService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const parsed = parseBrandIdsParam(searchParams.get("brand_ids"));

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const brandIds = parsed.ids;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, owned_brands")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("[brandAnalytics] profile fetch failed", {
        code: profileError.code,
        userId,
      });
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const access = assertBrandAnalyticsAccess(profile, brandIds);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const analytics = await loadBrandAnalytics(supabase, brandIds);
    if (!analytics.ok) {
      return NextResponse.json(
        { error: analytics.error },
        { status: 500 }
      );
    }

    console.info("[brandAnalytics] ok", {
      userId,
      brandCount: brandIds.length,
    });

    return NextResponse.json(analytics.data);
  } catch (err) {
    console.error("[brandAnalytics] unexpected failure", {
      name: err instanceof Error ? err.name : "unknown",
    });
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
