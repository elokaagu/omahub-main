import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Enhanced authentication with better error handling
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      return NextResponse.json(
        { error: "Session invalid - please sign in again" },
        { status: 401 }
      );
    }

    if (!session?.user) {
      console.error("No session or user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    console.log("✅ Inbox API: User authenticated:", user.email);

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

    // Check if user has inbox access
    if (!["super_admin", "brand_admin"].includes(profile.role)) {
      console.log("❌ Access denied for role:", profile.role);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    console.log("✅ Access granted for role:", profile.role);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const inquiryType = searchParams.get("type");
    const brandId = searchParams.get("brandId");
    const search = searchParams.get("search");

    const offset = (page - 1) * limit;

    // Build query - check if inquiries table/view exists
    let query;
    try {
      query = supabase
        .from("inquiries_with_details")
        .select("*", { count: "exact" });
    } catch (viewError) {
      console.log(
        "⚠️ inquiries_with_details view not found, using inquiries table"
      );
      query = supabase.from("inquiries").select(
        `
          *,
          brands:brand_id (
            name,
            category,
            image
          )
        `,
        { count: "exact" }
      );
    }

    // Apply role-based filtering
    if (profile.role === "brand_admin") {
      if (!profile.owned_brands || profile.owned_brands.length === 0) {
        return NextResponse.json({
          inquiries: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
        });
      }
      query = query.in("brand_id", profile.owned_brands);
    }

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (priority) {
      query = query.eq("priority", priority);
    }
    if (inquiryType) {
      query = query.eq("inquiry_type", inquiryType);
    }
    if (brandId) {
      query = query.eq("brand_id", brandId);
    }
    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`
      );
    }

    // Apply pagination and ordering
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: inquiries, error, count } = await query;

    if (error) {
      console.error("Error fetching inquiries:", error);

      // If table doesn't exist, return empty results
      if (
        error.message?.includes("relation") &&
        error.message?.includes("does not exist")
      ) {
        console.log("⚠️ Inquiries table not found, returning empty results");
        return NextResponse.json({
          inquiries: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
        });
      }

      return NextResponse.json(
        { error: "Failed to fetch inquiries" },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    console.log(
      `✅ Fetched ${inquiries?.length || 0} inquiries for ${user.email}`
    );

    return NextResponse.json({
      inquiries: inquiries || [],
      totalCount: count || 0,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Inbox API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new inquiry (for public contact forms)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    const {
      brandId,
      customerName,
      customerEmail,
      customerPhone,
      subject,
      message,
      inquiryType = "general",
      priority = "normal",
      source = "website",
    } = body;

    // Validate required fields
    if (!brandId || !customerName || !customerEmail || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify brand exists
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name")
      .eq("id", brandId)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Create inquiry
    const { data: inquiry, error: insertError } = await supabase
      .from("inquiries")
      .insert({
        brand_id: brandId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        subject,
        message,
        inquiry_type: inquiryType,
        priority,
        source,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating inquiry:", insertError);
      return NextResponse.json(
        { error: "Failed to create inquiry" },
        { status: 500 }
      );
    }

    // TODO: Send email notification to brand admin
    // This would be implemented with your email service

    return NextResponse.json({
      message: "Inquiry created successfully",
      inquiry,
    });
  } catch (error) {
    console.error("Create inquiry error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
