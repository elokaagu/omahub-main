import { NextRequest, NextResponse } from "next/server";
import {
  formatAdminDisplayName,
  requireReviewsAdmin,
  type ReviewsAdminProfile,
} from "@/lib/auth/requireAdminSession";
import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase-unified";
import {
  parseReviewReplyDeleteQuery,
  reviewReplyCreateSchema,
  reviewReplyUpdateSchema,
} from "@/lib/validation/reviewReplies";

export const dynamic = "force-dynamic";

type UserSupabase = Awaited<ReturnType<typeof createServerSupabaseClient>>;

function jsonValidationError(error: { flatten: () => unknown }) {
  return NextResponse.json(
    { error: "Invalid request", details: error.flatten() },
    { status: 400 }
  );
}

/**
 * Brand admins may only act on reviews for brands in owned_brands.
 * Super admins may act on any review.
 */
async function canAccessReview(
  supabaseUser: UserSupabase,
  reviewId: string,
  userRole: string,
  ownedBrands: string[]
): Promise<boolean> {
  if (userRole === "super_admin") {
    return true;
  }

  if (userRole === "brand_admin") {
    const { data: review, error } = await supabaseUser
      .from("reviews")
      .select("brand_id")
      .eq("id", reviewId)
      .maybeSingle();

    if (error || !review?.brand_id) {
      return false;
    }

    return ownedBrands.includes(review.brand_id);
  }

  return false;
}

/**
 * PUT/DELETE: super_admin always; brand_admin only if they authored the reply
 * and still have access to the parent review's brand.
 */
async function canMutateReply(
  supabaseUser: UserSupabase,
  profile: ReviewsAdminProfile,
  userId: string,
  existingReply: { admin_id: string; review_id: string }
): Promise<boolean> {
  if (profile.role === "super_admin") {
    return true;
  }
  if (existingReply.admin_id !== userId) {
    return false;
  }
  if (profile.role === "brand_admin") {
    return canAccessReview(
      supabaseUser,
      existingReply.review_id,
      profile.role,
      profile.owned_brands
    );
  }
  return false;
}

function getAdminDb() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

// POST - Create a new reply to a review
export async function POST(request: NextRequest) {
  try {
    const auth = await requireReviewsAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { userId, supabase: supabaseUser, profile } = auth;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = reviewReplyCreateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonValidationError(parsed.error);
    }

    const { reviewId, replyText } = parsed.data;

    const allowed = await canAccessReview(
      supabaseUser,
      reviewId,
      profile.role,
      profile.owned_brands
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Access denied to this review" },
        { status: 403 }
      );
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      console.error("review-replies POST: admin client unavailable");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 503 }
      );
    }

    const { data: reply, error: createError } = await adminDb
      .from("review_replies")
      .insert({
        review_id: reviewId,
        admin_id: userId,
        reply_text: replyText,
      })
      .select(
        `
        id,
        review_id,
        admin_id,
        reply_text,
        created_at,
        updated_at
      `
      )
      .single();

    if (createError) {
      console.error("review-replies POST:", createError.code, createError.message);
      return NextResponse.json(
        { error: "Failed to create reply" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reply created successfully",
      reply: {
        ...reply,
        admin_name: formatAdminDisplayName(profile),
      },
    });
  } catch (error) {
    console.error("POST /api/admin/reviews/replies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update an existing reply
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireReviewsAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { userId, supabase: supabaseUser, profile } = auth;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = reviewReplyUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonValidationError(parsed.error);
    }

    const { replyId, replyText } = parsed.data;

    const adminDb = getAdminDb();
    if (!adminDb) {
      console.error("review-replies PUT: admin client unavailable");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 503 }
      );
    }

    const { data: existingReply, error: fetchError } = await adminDb
      .from("review_replies")
      .select("id, admin_id, review_id")
      .eq("id", replyId)
      .maybeSingle();

    if (fetchError || !existingReply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    const canUpdate = await canMutateReply(
      supabaseUser,
      profile,
      userId,
      existingReply
    );
    if (!canUpdate) {
      return NextResponse.json(
        { error: "You cannot update this reply" },
        { status: 403 }
      );
    }

    const { data: updatedReply, error: updateError } = await adminDb
      .from("review_replies")
      .update({ reply_text: replyText })
      .eq("id", replyId)
      .select(
        `
        id,
        review_id,
        admin_id,
        reply_text,
        created_at,
        updated_at
      `
      )
      .single();

    if (updateError) {
      console.error("review-replies PUT:", updateError.code, updateError.message);
      return NextResponse.json(
        { error: "Failed to update reply" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reply updated successfully",
      reply: {
        ...updatedReply,
        admin_name: formatAdminDisplayName(profile),
      },
    });
  } catch (error) {
    console.error("PUT /api/admin/reviews/replies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a reply
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireReviewsAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { userId, supabase: supabaseUser, profile } = auth;

    const parsedQ = parseReviewReplyDeleteQuery(
      new URL(request.url).searchParams
    );
    if (!parsedQ.success) {
      return jsonValidationError(parsedQ.error);
    }
    const replyId = parsedQ.data.id;

    const adminDb = getAdminDb();
    if (!adminDb) {
      console.error("review-replies DELETE: admin client unavailable");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 503 }
      );
    }

    const { data: existingReply, error: fetchError } = await adminDb
      .from("review_replies")
      .select("id, admin_id, review_id")
      .eq("id", replyId)
      .maybeSingle();

    if (fetchError || !existingReply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    const canDelete = await canMutateReply(
      supabaseUser,
      profile,
      userId,
      existingReply
    );
    if (!canDelete) {
      return NextResponse.json(
        { error: "You cannot delete this reply" },
        { status: 403 }
      );
    }

    const { error: deleteError } = await adminDb
      .from("review_replies")
      .delete()
      .eq("id", replyId);

    if (deleteError) {
      console.error("review-replies DELETE:", deleteError.code, deleteError.message);
      return NextResponse.json(
        { error: "Failed to delete reply" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reply deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/admin/reviews/replies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
