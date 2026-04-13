import { NextRequest, NextResponse } from "next/server";
import { requireReviewsAdmin } from "@/lib/auth/requireAdminSession";
import {
  parseAdminReviewDeleteQuery,
  parseAdminReviewsListQuery,
} from "@/lib/validation/adminReviews";

export const dynamic = "force-dynamic";

/** Columns required by studio review management UI (matches `reviews_with_details`). */
const REVIEWS_LIST_SELECT = [
  "id",
  "brand_id",
  "user_id",
  "author",
  "comment",
  "rating",
  "date",
  "created_at",
  "updated_at",
  "brand_name",
  "brand_category",
  "replies",
].join(", ");

function jsonValidationError(error: { flatten: () => unknown }) {
  return NextResponse.json(
    { error: "Invalid request", details: error.flatten() },
    { status: 400 }
  );
}

// GET - Fetch reviews based on user role
export async function GET(request: NextRequest) {
  try {
    const auth = await requireReviewsAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase, profile } = auth;

    const parsed = parseAdminReviewsListQuery(
      new URL(request.url).searchParams
    );
    if (!parsed.success) {
      return jsonValidationError(parsed.error);
    }

    const { page, limit, brandId } = parsed.data;
    const offset = (page - 1) * limit;

    if (profile.role === "brand_admin" && profile.owned_brands.length === 0) {
      return NextResponse.json({
        reviews: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: page,
      });
    }

    let query = supabase
      .from("reviews_with_details")
      .select(REVIEWS_LIST_SELECT, { count: "exact" });

    if (profile.role === "brand_admin") {
      query = query.in("brand_id", profile.owned_brands);
    }

    if (brandId) {
      if (
        profile.role === "brand_admin" &&
        !profile.owned_brands.includes(brandId)
      ) {
        return NextResponse.json(
          { error: "Access denied to this brand" },
          { status: 403 }
        );
      }
      query = query.eq("brand_id", brandId);
    }

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: reviews, error, count } = await query;

    if (error) {
      console.error("admin/reviews GET:", error.code, error.message);
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
    console.error("GET /api/admin/reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a review (replies cascade)
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireReviewsAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase, profile } = auth;

    const parsedQ = parseAdminReviewDeleteQuery(
      new URL(request.url).searchParams
    );
    if (!parsedQ.success) {
      return jsonValidationError(parsedQ.error);
    }
    const reviewId = parsedQ.data.id;

    const { data: review, error: fetchError } = await supabase
      .from("reviews")
      .select("id, brand_id")
      .eq("id", reviewId)
      .maybeSingle();

    if (fetchError || !review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (
      profile.role === "brand_admin" &&
      !profile.owned_brands.includes(review.brand_id)
    ) {
      return NextResponse.json(
        { error: "Access denied to this review" },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (deleteError) {
      console.error("admin/reviews DELETE:", deleteError.code, deleteError.message);
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
    console.error("DELETE /api/admin/reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
