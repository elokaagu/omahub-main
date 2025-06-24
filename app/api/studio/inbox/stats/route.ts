import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile with fallback for super_admin users
    let profile;
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role, owned_brands")
      .eq("id", user.id)
      .single();

    if (profileError || !profileData) {
      console.log(
        "⚠️ Profile not found, checking user email for super_admin access"
      );

      // Fallback: Check if user email indicates super_admin access
      if (
        user.email === "eloka.agu@icloud.com" ||
        user.email === "shannonalisa@oma-hub.com"
      ) {
        profile = {
          role: "super_admin",
          owned_brands: [],
        };
        console.log(
          "✅ Granted super_admin access based on email:",
          user.email
        );
      } else {
        console.error("Profile error:", profileError);
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 404 }
        );
      }
    } else {
      profile = profileData;
    }

    // Check permissions
    if (!["super_admin", "brand_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Use the database function to get stats
    const { data: stats, error: statsError } = await supabase.rpc(
      "get_inbox_stats",
      { admin_user_id: user.id }
    );

    if (statsError) {
      console.error("Error fetching inbox stats:", statsError);
      return NextResponse.json(
        { error: "Failed to fetch statistics" },
        { status: 500 }
      );
    }

    // Get additional stats manually for more detailed breakdown
    let baseQuery = supabase
      .from("inquiries")
      .select("*", { count: "exact", head: true });

    // Apply role-based filtering
    if (profile.role === "brand_admin") {
      if (!profile.owned_brands || profile.owned_brands.length === 0) {
        return NextResponse.json({
          totalInquiries: 0,
          unreadInquiries: 0,
          repliedInquiries: 0,
          urgentInquiries: 0,
          todayInquiries: 0,
          thisWeekInquiries: 0,
          inquiriesByType: {},
          inquiriesByPriority: {},
          inquiriesByStatus: {},
        });
      }
      baseQuery = baseQuery.in("brand_id", profile.owned_brands);
    }

    // Get today's inquiries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayCount } = await baseQuery.gte(
      "created_at",
      today.toISOString()
    );

    // Get this week's inquiries
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const { count: weekCount } = await baseQuery.gte(
      "created_at",
      weekStart.toISOString()
    );

    // Get breakdown by type, priority, and status
    let detailQuery = supabase
      .from("inquiries")
      .select("inquiry_type, priority, status");

    if (profile.role === "brand_admin") {
      detailQuery = detailQuery.in("brand_id", profile.owned_brands);
    }

    const { data: breakdownData, error: breakdownError } = await detailQuery;

    if (breakdownError) {
      console.error("Error fetching breakdown data:", breakdownError);
    }

    // Process breakdown data
    const inquiriesByType: Record<string, number> = {};
    const inquiriesByPriority: Record<string, number> = {};
    const inquiriesByStatus: Record<string, number> = {};

    if (breakdownData) {
      breakdownData.forEach((inquiry) => {
        // Count by type
        inquiriesByType[inquiry.inquiry_type] =
          (inquiriesByType[inquiry.inquiry_type] || 0) + 1;

        // Count by priority
        inquiriesByPriority[inquiry.priority] =
          (inquiriesByPriority[inquiry.priority] || 0) + 1;

        // Count by status
        inquiriesByStatus[inquiry.status] =
          (inquiriesByStatus[inquiry.status] || 0) + 1;
      });
    }

    const result = {
      totalInquiries: stats?.[0]?.total_inquiries || 0,
      unreadInquiries: stats?.[0]?.unread_inquiries || 0,
      repliedInquiries: stats?.[0]?.replied_inquiries || 0,
      urgentInquiries: stats?.[0]?.urgent_inquiries || 0,
      todayInquiries: todayCount || 0,
      thisWeekInquiries: weekCount || 0,
      inquiriesByType,
      inquiriesByPriority,
      inquiriesByStatus,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Inbox stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
