import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = await getAdminClient();
    
    if (!supabase) {
      console.error("❌ Failed to get admin client");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    // Get current date info
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calculate date ranges
    const thisMonthStart = new Date(currentYear, currentMonth, 1);
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthEnd = new Date(currentYear, currentMonth, 0);

    // Get total counts by status
    const { data: statusCounts, error: statusError } = await supabase
      .from("newsletter_subscribers")
      .select("subscription_status");

    if (statusError) {
      console.error("❌ Error fetching status counts:", statusError);
      return NextResponse.json(
        { error: "Failed to fetch statistics" },
        { status: 500 }
      );
    }

    // Calculate status-based counts
    const total = statusCounts?.length || 0;
    const active = statusCounts?.filter(s => s.subscription_status === 'active').length || 0;
    const unsubscribed = statusCounts?.filter(s => s.subscription_status === 'unsubscribed').length || 0;
    const bounced = statusCounts?.filter(s => s.subscription_status === 'bounced').length || 0;
    const pending = statusCounts?.filter(s => s.subscription_status === 'pending').length || 0;

    // Get this month's subscriptions
    const { data: thisMonthSubs, error: thisMonthError } = await supabase
      .from("newsletter_subscribers")
      .select("id")
      .gte("subscribed_at", thisMonthStart.toISOString())
      .lte("subscribed_at", now.toISOString());

    if (thisMonthError) {
      console.error("❌ Error fetching this month subscriptions:", thisMonthError);
    }

    const thisMonth = thisMonthSubs?.length || 0;

    // Get last month's subscriptions
    const { data: lastMonthSubs, error: lastMonthError } = await supabase
      .from("newsletter_subscribers")
      .select("id")
      .gte("subscribed_at", lastMonthStart.toISOString())
      .lte("subscribed_at", lastMonthEnd.toISOString());

    if (lastMonthError) {
      console.error("❌ Error fetching last month subscriptions:", lastMonthError);
    }

    const lastMonth = lastMonthSubs?.length || 0;

    // Calculate growth percentage
    let growth = 0;
    if (lastMonth > 0) {
      growth = ((thisMonth - lastMonth) / lastMonth) * 100;
    } else if (thisMonth > 0) {
      growth = 100; // If last month was 0 and this month has subscriptions
    }

    const stats = {
      total,
      active,
      unsubscribed,
      bounced,
      pending,
      thisMonth,
      lastMonth,
      growth: Math.round(growth * 100) / 100 // Round to 2 decimal places
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error("💥 Newsletter stats API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
