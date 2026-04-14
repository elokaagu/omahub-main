import { NextRequest, NextResponse } from "next/server";
import { createApiRouteSupabaseClient } from "@/lib/supabase-unified";
import {
  parsePublicReviewGet,
  parsePublicReviewPost,
} from "@/lib/validation/publicReviews";

function resolveAuthorDisplayName(profile, fallbackEmail) {
  const first = typeof profile?.first_name === "string" ? profile.first_name.trim() : "";
  const last = typeof profile?.last_name === "string" ? profile.last_name.trim() : "";
  const full = `${first} ${last}`.trim();
  if (full) return full;
  if (typeof profile?.username === "string" && profile.username.trim()) {
    return profile.username.trim();
  }
  if (fallbackEmail && typeof fallbackEmail === "string") {
    return fallbackEmail.split("@")[0] || "Verified User";
  }
  return "Verified User";
}

export async function POST(request) {
  try {
    const supabase = createApiRouteSupabaseClient(request);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: "Authentication required to submit reviews" },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = parsePublicReviewPost(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid review payload" }, { status: 400 });
    }

    const userId = session.user.id;
    const { brandId, comment, rating } = parsed.data;
    const date = parsed.data.date || new Date().toISOString().split("T")[0];

    // One review per user per brand policy.
    const { data: existingReview, error: existingError } = await supabase
      .from("reviews")
      .select("id")
      .eq("brand_id", brandId)
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error("reviews_duplicate_check_failed", existingError.message);
      return NextResponse.json(
        { error: "Failed to submit review" },
        { status: 500 }
      );
    }

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this brand" },
        { status: 409 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, username")
      .eq("id", userId)
      .maybeSingle();

    const author = resolveAuthorDisplayName(profile, session.user.email || "");

    const reviewData = {
      brand_id: brandId,
      author,
      comment,
      rating,
      date,
      user_id: userId,
    };

    const { data, error } = await supabase
      .from("reviews")
      .insert([reviewData])
      .select("id, brand_id, author, comment, rating, date, user_id, created_at")
      .single();

    if (error) {
      console.error("review_insert_failed", error.message);
      return NextResponse.json({ error: "Failed to add review" }, { status: 500 });
    }

    // Notify brand owner via notifications table (avoid fake inquiry records).
    const { data: brandOwner } = await supabase
      .from("brands")
      .select("user_id")
      .eq("id", brandId)
      .maybeSingle();

    if (brandOwner?.user_id) {
      void supabase.from("notifications").insert({
        user_id: brandOwner.user_id,
        brand_id: brandId,
        type: "new_review",
        title: "New Review Received",
        message: `A ${rating}-star review was posted for your brand`,
        data: {
          review_id: data.id,
          rating,
        },
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    await updateBrandRating(supabase, brandId);

    return NextResponse.json({
      success: true,
      message: "Review added successfully",
      review: data,
    });
  } catch (error) {
    console.error(
      "reviews_post_unexpected",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const supabase = createApiRouteSupabaseClient(request);
    const { searchParams } = new URL(request.url);

    const parsed = parsePublicReviewGet(searchParams);
    if (!parsed.success) {
      return NextResponse.json({ error: "Brand ID is required" }, { status: 400 });
    }

    const { brandId } = parsed.data;

    const { data, error } = await supabase
      .from("reviews_with_details")
      .select(
        "id, brand_id, author, comment, rating, date, user_id, created_at, brand_name, brand_category, replies"
      )
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("reviews_fetch_failed", error.message);
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }

    return NextResponse.json({ reviews: data || [] });
  } catch (error) {
    console.error(
      "reviews_get_unexpected",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

async function updateBrandRating(supabase, brandId) {
  try {
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("rating")
      .eq("brand_id", brandId);

    if (reviewsError || !reviews || reviews.length === 0) return;

    const totalRating = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    const averageRating = totalRating / reviews.length;

    await supabase.from("brands").update({ rating: averageRating }).eq("id", brandId);
  } catch (error) {
    console.error(
      "reviews_rating_update_failed",
      error instanceof Error ? error.message : String(error)
    );
  }
}
