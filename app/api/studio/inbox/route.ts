import { NextRequest, NextResponse } from "next/server";
import { requireStudioInboxAccess } from "@/lib/auth/requireStudioInboxAccess";

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStudioInboxAccess();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { userId, profile, supabase } = auth;
    const ownedBrands = Array.isArray(profile.owned_brands)
      ? profile.owned_brands
      : [];

    const url = new URL(request.url);
    const inquiriesLimit = Math.min(
      200,
      Math.max(1, Number(url.searchParams.get("inquiriesLimit") || 50))
    );
    const notificationsLimit = Math.min(
      200,
      Math.max(1, Number(url.searchParams.get("notificationsLimit") || 50))
    );

    // Build base query for inquiries
    let inquiriesQuery = supabase
      .from("inquiries")
      .select(`
        id,
        brand_id,
        customer_name,
        customer_email,
        subject,
        message,
        inquiry_type,
        priority,
        status,
        source,
        created_at,
        updated_at,
        is_read,
        replied_at,
        brand:brands(
          id,
          name,
          category
        )
      `)
      .order("created_at", { ascending: false })
      .limit(inquiriesLimit);

    // Apply role-based filtering
    if (profile.role === "brand_admin") {
      if (ownedBrands.length === 0) {
        return NextResponse.json({ success: true, inquiries: [], notifications: [] });
      }
      inquiriesQuery = inquiriesQuery.in("brand_id", ownedBrands);
    }

    // Fetch inquiries
    const { data: inquiries, error: inquiriesError } = await inquiriesQuery;

    if (inquiriesError) {
      console.error(
        "❌ Error fetching inquiries:",
        inquiriesError.code,
        inquiriesError.message,
        inquiriesError.details ?? ""
      );
      return NextResponse.json(
        { error: "Failed to fetch inquiries" },
        { status: 500 }
      );
    }

    // Build query for notifications
    let notificationsQuery = supabase
      .from("notifications")
      .select(
        `
        id,
        user_id,
        brand_id,
        title,
        message,
        type,
        is_read,
        data,
        created_at
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(notificationsLimit);

    // Apply role-based filtering for notifications
    if (profile.role === "brand_admin" && ownedBrands.length > 0) {
      notificationsQuery = notificationsQuery.in("brand_id", ownedBrands);
    }

    const { data: notifications, error: notificationsError } = await notificationsQuery;

    if (notificationsError) {
      console.warn(
        "⚠️ Failed to fetch notifications:",
        notificationsError.code,
        notificationsError.message,
        notificationsError.details ?? ""
      );
      // Continue without notifications
    }

    return NextResponse.json({
      success: true,
      inquiries: inquiries || [],
      notifications: notifications || [],
    });
  } catch (error) {
    console.error("💥 Get inbox error:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
