import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log("❌ Unauthorized inbox access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile with role and owned brands
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, owned_brands")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("❌ Profile not found:", profileError);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check permissions
    if (!["super_admin", "brand_admin"].includes(profile.role)) {
      console.log("❌ Access denied for role:", profile.role);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    console.log("📧 Loading inbox for user:", user.email, "Role:", profile.role);

    // Build base query for inquiries
    let inquiriesQuery = supabase
      .from("inquiries")
      .select(`
        *,
        brand:brands(
          id,
          name,
          category
        )
      `)
      .order("created_at", { ascending: false });

    // Apply role-based filtering
    if (profile.role === "brand_admin" && profile.owned_brands?.length > 0) {
      console.log("🔍 Brand admin filtering by owned brands:", profile.owned_brands);
      
      // For brand admins, show inquiries for their owned brands
      inquiriesQuery = inquiriesQuery.in("brand_id", profile.owned_brands);
    } else if (profile.role === "brand_admin") {
      console.log("⚠️ Brand admin has no owned brands");
      return NextResponse.json({ success: true, inquiries: [], notifications: [] });
    } else {
      console.log("🔍 Super admin - showing all inquiries");
      // Super admins see all inquiries (no filtering)
    }

    // Fetch inquiries
    const { data: inquiries, error: inquiriesError } = await inquiriesQuery;

    if (inquiriesError) {
      console.error("❌ Error fetching inquiries:", inquiriesError);
      return NextResponse.json(
        { error: "Failed to fetch inquiries" },
        { status: 500 }
      );
    }

    // Debug: Log what inquiries were returned
    console.log("🔍 Inquiries returned:", inquiries?.map((inq) => ({
      id: inq.id,
      customer_name: inq.customer_name,
      brand_id: inq.brand_id,
      brand_name: inq.brand?.name,
      inquiry_type: inq.inquiry_type,
      status: inq.status,
      source: inq.source,
      created_at: inq.created_at
    })));

    // Build query for notifications
    let notificationsQuery = supabase
      .from("notifications")
      .select(`
        *,
        brand:brands(name)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Apply role-based filtering for notifications
    if (profile.role === "brand_admin" && profile.owned_brands?.length > 0) {
      notificationsQuery = notificationsQuery.in("brand_id", profile.owned_brands);
    }

    const { data: notifications, error: notificationsError } = await notificationsQuery;

    if (notificationsError) {
      console.warn("⚠️ Failed to fetch notifications:", notificationsError);
      // Continue without notifications
    }

    console.log(`✅ Loaded ${inquiries?.length || 0} inquiries and ${notifications?.length || 0} notifications`);

    return NextResponse.json({
      success: true,
      inquiries: inquiries || [],
      notifications: notifications || [],
    });
  } catch (error) {
    console.error("💥 Get inbox error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
