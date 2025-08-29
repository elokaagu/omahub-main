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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const source = searchParams.get("source") || "";

    const offset = (page - 1) * limit;

    // Build the query
    let query = supabase
      .from("newsletter_subscribers")
      .select("*", { count: "exact" });

    // Apply filters
    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
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
      console.error("❌ Error fetching subscribers:", error);
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
    console.error("💥 Newsletter subscribers API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
