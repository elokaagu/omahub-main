import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to verify admin permissions
async function verifyAdminPermissions(request: NextRequest) {
  console.log("🔐 verifyAdminPermissions called");
  
  const authHeader = request.headers.get("authorization");
  console.log("🔑 Auth header present:", !!authHeader);
  
  if (!authHeader?.startsWith("Bearer ")) {
    console.log("❌ Missing or invalid authorization header");
    return { error: "Missing or invalid authorization header", status: 401 };
  }

  const token = authHeader.split(" ")[1];
  console.log("🔑 Token extracted, length:", token.length);

  try {
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.log("❌ User auth failed:", userError);
      return { error: "Invalid authentication token", status: 401 };
    }

    console.log("✅ User authenticated:", user.email, "ID:", user.id);

    // Get user profile to check role
    console.log("🔍 Fetching user profile...");
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, owned_brands")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.log("❌ Profile fetch failed:", profileError);
      return { error: "User profile not found", status: 404 };
    }

    console.log("✅ Profile found, role:", profile.role, "owned brands:", profile.owned_brands?.length || 0);

    if (!["super_admin", "brand_admin"].includes(profile.role)) {
      console.log("❌ Insufficient role:", profile.role);
      return { error: "Insufficient permissions", status: 403 };
    }

    console.log("✅ Admin permissions verified");
    return { user, profile };
  } catch (error) {
    console.error("💥 Error in verifyAdminPermissions:", error);
    return { error: "Authentication error", status: 500 };
  }
}

// GET - Fetch reviews based on user role
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminPermissions(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { user, profile } = authResult;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const brandId = searchParams.get("brandId");
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("reviews_with_details")
      .select("*", { count: "exact" });

    // Filter based on user role
    if (profile.role === "brand_admin") {
      // Brand admins can only see reviews for their owned brands
      if (!profile.owned_brands || profile.owned_brands.length === 0) {
        return NextResponse.json({
          reviews: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
        });
      }
      query = query.in("brand_id", profile.owned_brands);
    }

    // Filter by specific brand if requested
    if (brandId) {
      // Verify brand admin can access this brand
      if (
        profile.role === "brand_admin" &&
        !profile.owned_brands?.includes(brandId)
      ) {
        return NextResponse.json(
          { error: "Access denied to this brand" },
          { status: 403 }
        );
      }
      query = query.eq("brand_id", brandId);
    }

    // Add pagination
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: reviews, error, count } = await query;

    if (error) {
      console.error("Error fetching reviews:", error);
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      reviews: reviews || [],
      totalCount: count || 0,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/admin/reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a review
export async function DELETE(request: NextRequest) {
  try {
    console.log("🗑️ DELETE /api/admin/reviews called");
    
    const authResult = await verifyAdminPermissions(request);
    if ("error" in authResult) {
      console.log("❌ Auth failed:", authResult.error);
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { user, profile } = authResult;
    console.log("✅ Auth successful for user:", user.email, "role:", profile.role);
    
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("id");
    console.log("🔍 Review ID from params:", reviewId);

    if (!reviewId) {
      console.log("❌ No review ID provided");
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      );
    }

    // Get the review to check permissions
    console.log("🔍 Fetching review details for ID:", reviewId);
    const { data: review, error: fetchError } = await supabaseAdmin
      .from("reviews")
      .select("id, brand_id, author, comment")
      .eq("id", reviewId)
      .single();

    if (fetchError || !review) {
      console.log("❌ Review not found:", fetchError);
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    console.log("✅ Review found:", review.author, "for brand:", review.brand_id);

    // Check if brand admin has access to this review's brand
    if (profile.role === "brand_admin") {
      if (!profile.owned_brands?.includes(review.brand_id)) {
        console.log("❌ Brand admin access denied to brand:", review.brand_id);
        return NextResponse.json(
          { error: "Access denied to this review" },
          { status: 403 }
        );
      }
      console.log("✅ Brand admin has access to this review");
    }

    // Delete the review (replies will cascade delete)
    console.log("🗑️ Deleting review:", reviewId);
    const { error: deleteError } = await supabaseAdmin
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (deleteError) {
      console.error("❌ Error deleting review:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete review" },
        { status: 500 }
      );
    }

    console.log("✅ Review deleted successfully");
    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("💥 Unexpected error in DELETE /api/admin/reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
