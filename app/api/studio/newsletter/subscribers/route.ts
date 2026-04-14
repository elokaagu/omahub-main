import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";

// Force dynamic rendering since we use request.url
export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_SEARCH_LENGTH = 120;
const ALLOWED_STATUSES = ["active", "unsubscribed", "bounced", "pending"] as const;
const ALLOWED_SOURCES = ["website", "landing_page", "manual", "import", "api"] as const;
const SUBSCRIBER_SELECT_FIELDS =
  "id, email, first_name, last_name, subscription_status, source, subscribed_at, unsubscribed_at, email_count, last_email_sent, created_at, updated_at";

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function escapeForIlike(input: string): string {
  return input.replace(/[%_]/g, "").trim();
}

export async function GET(request: NextRequest) {
  try {
    const authz = await requireSuperAdmin();
    if (!authz.ok) {
      return NextResponse.json({ error: authz.error }, { status: authz.status });
    }

    const supabase = await getAdminClient();
    
    if (!supabase) {
      console.error("❌ Failed to get admin client");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const limit = Math.min(
      MAX_LIMIT,
      parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT)
    );
    const search = (searchParams.get("search") || "").trim();
    const status = searchParams.get("status") || "";
    const source = searchParams.get("source") || "";

    if (search.length > MAX_SEARCH_LENGTH) {
      return NextResponse.json(
        { error: `Search must be ${MAX_SEARCH_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }
    if (status && !ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
      return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
    }
    if (source && !ALLOWED_SOURCES.includes(source as (typeof ALLOWED_SOURCES)[number])) {
      return NextResponse.json({ error: "Invalid source filter" }, { status: 400 });
    }

    const offset = (page - 1) * limit;

    // Build the query
    let query = supabase
      .from("newsletter_subscribers")
      .select(SUBSCRIBER_SELECT_FIELDS, { count: "exact" });

    // Apply filters
    if (search) {
      const cleanSearch = escapeForIlike(search);
      query = query.or(
        `email.ilike.%${cleanSearch}%,first_name.ilike.%${cleanSearch}%,last_name.ilike.%${cleanSearch}%`
      );
    }

    if (status) {
      query = query.eq("subscription_status", status);
    }

    if (source) {
      query = query.eq("source", source);
    }

    // Apply pagination and ordering
    query = query
      .order("subscribed_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: subscribers, error, count } = await query;

    if (error) {
      console.error("❌ Error fetching subscribers:", error.code);
      return NextResponse.json(
        { error: "Failed to fetch subscribers" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscribers: subscribers || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    });

  } catch (error) {
    console.error(
      "💥 Newsletter subscribers API error:",
      error instanceof Error ? error.name : "unknown"
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
