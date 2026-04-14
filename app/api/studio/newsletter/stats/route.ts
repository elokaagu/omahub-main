import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";

function countQuery(
  supabase: NonNullable<Awaited<ReturnType<typeof getAdminClient>>>
) {
  return supabase
    .from("newsletter_subscribers")
    .select("id", { count: "exact", head: true });
}

export async function GET(_request: NextRequest) {
  try {
    const authz = await requireSuperAdmin();
    if (!authz.ok) {
      return NextResponse.json({ error: authz.error }, { status: authz.status });
    }

    const supabase = await getAdminClient();

    if (!supabase) {
      console.error("Failed to get admin client");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthStart = new Date(currentYear, currentMonth, 1);
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthEnd = new Date(currentYear, currentMonth, 0);

    const thisMonthStartIso = thisMonthStart.toISOString();
    const nowIso = now.toISOString();
    const lastMonthStartIso = lastMonthStart.toISOString();
    const lastMonthEndIso = lastMonthEnd.toISOString();

    const [
      totalRes,
      activeRes,
      unsubscribedRes,
      bouncedRes,
      pendingRes,
      thisMonthRes,
      lastMonthRes,
    ] = await Promise.all([
      countQuery(supabase),
      countQuery(supabase).eq("subscription_status", "active"),
      countQuery(supabase).eq("subscription_status", "unsubscribed"),
      countQuery(supabase).eq("subscription_status", "bounced"),
      countQuery(supabase).eq("subscription_status", "pending"),
      countQuery(supabase)
        .gte("subscribed_at", thisMonthStartIso)
        .lte("subscribed_at", nowIso),
      countQuery(supabase)
        .gte("subscribed_at", lastMonthStartIso)
        .lte("subscribed_at", lastMonthEndIso),
    ]);

    const errors = [
      totalRes.error,
      activeRes.error,
      unsubscribedRes.error,
      bouncedRes.error,
      pendingRes.error,
      thisMonthRes.error,
      lastMonthRes.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      console.error(
        "Error fetching newsletter stats:",
        errors.map((e) => e?.code).join(", ")
      );
      return NextResponse.json(
        { error: "Failed to fetch statistics" },
        { status: 500 }
      );
    }

    const total = totalRes.count ?? 0;
    const active = activeRes.count ?? 0;
    const unsubscribed = unsubscribedRes.count ?? 0;
    const bounced = bouncedRes.count ?? 0;
    const pending = pendingRes.count ?? 0;
    const thisMonth = thisMonthRes.count ?? 0;
    const lastMonth = lastMonthRes.count ?? 0;

    let growth = 0;
    if (lastMonth > 0) {
      growth = ((thisMonth - lastMonth) / lastMonth) * 100;
    } else if (thisMonth > 0) {
      growth = 100;
    }

    const stats = {
      total,
      active,
      unsubscribed,
      bounced,
      pending,
      thisMonth,
      lastMonth,
      growth: Math.round(growth * 100) / 100,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error(
      "Newsletter stats API error:",
      error instanceof Error ? error.name : "unknown"
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
