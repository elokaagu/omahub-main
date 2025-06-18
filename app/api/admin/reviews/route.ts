import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to verify admin permissions
async function verifyAdminPermissions(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Missing or invalid authorization header", status: 401 };
  }

  const token = authHeader.split(" ")[1];

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);
  if (userError || !user) {
    return { error: "Invalid authentication token", status: 401 };
  }

  // Get user profile to check role
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role, owned_brands")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "User profile not found", status: 404 };
  }

  if (!["super_admin", "brand_admin"].includes(profile.role)) {
    return { error: "Insufficient permissions", status: 403 };
  }

  return { user, profile };
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
    const authResult = await verifyAdminPermissions(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { user, profile } = authResult;
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("id");

    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      );
    }

    // Get the review to check permissions
    const { data: review, error: fetchError } = await supabaseAdmin
      .from("reviews")
      .select("id, brand_id, author, comment")
      .eq("id", reviewId)
      .single();

    if (fetchError || !review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Check if brand admin has access to this review's brand
    if (profile.role === "brand_admin") {
      if (!profile.owned_brands?.includes(review.brand_id)) {
        return NextResponse.json(
          { error: "Access denied to this review" },
          { status: 403 }
        );
      }
    }

    // Delete the review (replies will cascade delete)
    const { error: deleteError } = await supabaseAdmin
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (deleteError) {
      console.error("Error deleting review:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete review" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Unexpected error in DELETE /api/admin/reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
