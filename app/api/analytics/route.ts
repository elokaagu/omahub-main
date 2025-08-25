import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";
import { getAnalyticsData } from "@/lib/services/analyticsService";

export async function GET() {
  try {
    // Authenticate user and check if they are a super admin
    const supabase = await createServerSupabaseClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a super admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Access denied - Super admin only" }, { status: 403 });
    }

    console.log("✅ Analytics API: Super admin access granted for user:", user.email);

    const data = await getAnalyticsData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch platform analytics" },
      { status: 500 }
    );
  }
}
