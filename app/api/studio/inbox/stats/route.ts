import { NextResponse } from "next/server";
import { requireStudioInboxAccess } from "@/lib/auth/requireStudioInboxAccess";

// Force dynamic rendering since we use cookies
export const dynamic = "force-dynamic";

type InboxStatsRpcRow = {
  total_inquiries: number | null;
  unread_inquiries: number | null;
  replied_inquiries: number | null;
  urgent_inquiries: number | null;
};

type InquiryBreakdownRow = {
  inquiry_type: string | null;
  priority: string | null;
  status: string | null;
};

function applyBrandScope(query: any, profile: { role: string; owned_brands?: string[] | null }) {
  if (profile.role === "brand_admin") {
    return query.in("brand_id", profile.owned_brands ?? []);
  }
  return query;
}

export async function GET() {
  try {
    const auth = await requireStudioInboxAccess();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { userId, profile, supabase } = auth;
    // Narrow typing: PostgREST builder generics hit TS2589 on chained .from().select() here.
    const db = supabase as any;

    // Use the database function to get stats
    const { data: stats, error: statsError } = await supabase.rpc(
      "get_inbox_stats",
      { admin_user_id: userId }
    );

    if (statsError) {
      console.error("Error fetching inbox stats:", statsError.code);
      return NextResponse.json(
        { error: "Failed to fetch statistics" },
        { status: 500 }
      );
    }

    // Get additional stats manually for more detailed breakdown
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
    }

    // Get today's inquiries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayQuery = applyBrandScope(
      db
        .from("inquiries")
        .select("id", { count: "exact", head: true })
        .gte("created_at", today.toISOString()),
      profile
    );
    const { count: todayCount, error: todayCountError } = await todayQuery;
    if (todayCountError) {
      console.error("Error fetching today's inquiry count:", todayCountError.code);
      return NextResponse.json(
        { error: "Failed to fetch statistics" },
        { status: 500 }
      );
    }

    // Get this week's inquiries
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekQuery = applyBrandScope(
      db
        .from("inquiries")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekStart.toISOString()),
      profile
    );
    const { count: weekCount, error: weekCountError } = await weekQuery;
    if (weekCountError) {
      console.error("Error fetching weekly inquiry count:", weekCountError.code);
      return NextResponse.json(
        { error: "Failed to fetch statistics" },
        { status: 500 }
      );
    }

    // Get breakdown by type, priority, and status
    const detailQuery = applyBrandScope(
      db.from("inquiries").select("inquiry_type, priority, status"),
      profile
    );

    const { data: breakdownData, error: breakdownError } = await detailQuery;

    if (breakdownError) {
      console.error("Error fetching breakdown data:", breakdownError.code);
    }

    // Process breakdown data
    const inquiriesByType: Record<string, number> = {};
    const inquiriesByPriority: Record<string, number> = {};
    const inquiriesByStatus: Record<string, number> = {};

    if (breakdownData) {
      (breakdownData as InquiryBreakdownRow[]).forEach((inquiry) => {
        // Count by type
        const typeKey = inquiry.inquiry_type || "unknown";
        inquiriesByType[typeKey] = (inquiriesByType[typeKey] || 0) + 1;

        // Count by priority
        const priorityKey = inquiry.priority || "unknown";
        inquiriesByPriority[priorityKey] =
          (inquiriesByPriority[priorityKey] || 0) + 1;

        // Count by status
        const statusKey = inquiry.status || "unknown";
        inquiriesByStatus[statusKey] = (inquiriesByStatus[statusKey] || 0) + 1;
      });
    }

    const statsRow = ((stats as InboxStatsRpcRow[] | null) ?? [])[0];

    const result = {
      totalInquiries: statsRow?.total_inquiries ?? 0,
      unreadInquiries: statsRow?.unread_inquiries ?? 0,
      repliedInquiries: statsRow?.replied_inquiries ?? 0,
      urgentInquiries: statsRow?.urgent_inquiries ?? 0,
      todayInquiries: todayCount || 0,
      thisWeekInquiries: weekCount || 0,
      inquiriesByType,
      inquiriesByPriority,
      inquiriesByStatus,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Inbox stats error:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
