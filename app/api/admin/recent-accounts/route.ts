import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { createAdminClient } from "@/lib/supabase-unified";
import { recentAccountsQuerySchema } from "@/lib/validation/recentAccounts";

export const dynamic = "force-dynamic";

/**
 * Super-admin dashboard: recent profile signups in a bounded time window.
 * Query: `days` (1–90, default 7), `limit` (1–50, default 10).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const parsed = recentAccountsQuerySchema.safeParse({
      days: searchParams.get("days") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { days, limit } = parsed.data;

    let admin;
    try {
      admin = createAdminClient();
    } catch (e) {
      console.error("Recent accounts: admin client unavailable:", e);
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 503 }
      );
    }

    const since = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data, error } = await admin
      .from("profiles")
      .select("id, email, role, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Recent accounts fetch error:", error.code, error.message);
      return NextResponse.json(
        { error: "Failed to fetch recent accounts" },
        { status: 500 }
      );
    }

    type Row = {
      id: string;
      email: string | null;
      role: string | null;
      created_at: string;
    };
    const rows = (data ?? []) as Row[];
    return NextResponse.json({
      data: rows.map((account) => ({
        ...account,
        hours_since_creation: Math.round(
          (Date.now() - new Date(account.created_at).getTime()) /
            (1000 * 60 * 60)
        ),
      })),
    });
  } catch (error) {
    console.error("Recent accounts API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
