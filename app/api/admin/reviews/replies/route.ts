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
    .select("role, owned_brands, first_name, last_name, email")
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

// Helper function to check if user can access a review
async function canAccessReview(
  userId: string,
  reviewId: string,
  userRole: string,
  ownedBrands: string[] = []
) {
  if (userRole === "super_admin") {
    return true;
  }

  if (userRole === "brand_admin") {
    // Get the review's brand_id
    const { data: review, error } = await supabaseAdmin
      .from("reviews")
      .select("brand_id")
      .eq("id", reviewId)
      .single();

    if (error || !review) {
      return false;
    }

    return ownedBrands.includes(review.brand_id);
  }

  return false;
}

// POST - Create a new reply to a review
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminPermissions(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { user, profile } = authResult;
    const body = await request.json();
    const { reviewId, replyText } = body;

    if (!reviewId || !replyText?.trim()) {
      return NextResponse.json(
        { error: "Review ID and reply text are required" },
        { status: 400 }
      );
    }

    // Check if user can access this review
    const canAccess = await canAccessReview(
      user.id,
      reviewId,
      profile.role,
      profile.owned_brands
    );
    if (!canAccess) {
      return NextResponse.json(
        { error: "Access denied to this review" },
        { status: 403 }
      );
    }

    // Create the reply
    const { data: reply, error: createError } = await supabaseAdmin
      .from("review_replies")
      .insert({
        review_id: reviewId,
        admin_id: user.id,
        reply_text: replyText.trim(),
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
      console.error("Error creating reply:", createError);
      return NextResponse.json(
        { error: "Failed to create reply" },
        { status: 500 }
      );
    }

    // Add admin name to the response
    const adminName =
      profile.first_name && profile.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : profile.email;

    return NextResponse.json({
      success: true,
      message: "Reply created successfully",
      reply: {
        ...reply,
        admin_name: adminName,
      },
    });
  } catch (error) {
    console.error(
      "Unexpected error in POST /api/admin/reviews/replies:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update an existing reply
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAdminPermissions(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { user, profile } = authResult;
    const body = await request.json();
    const { replyId, replyText } = body;

    if (!replyId || !replyText?.trim()) {
      return NextResponse.json(
        { error: "Reply ID and reply text are required" },
        { status: 400 }
      );
    }

    // Get the reply to check permissions
    const { data: existingReply, error: fetchError } = await supabaseAdmin
      .from("review_replies")
      .select("id, admin_id, review_id")
      .eq("id", replyId)
      .single();

    if (fetchError || !existingReply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    // Check if user can update this reply
    const canUpdate =
      profile.role === "super_admin" || existingReply.admin_id === user.id;
    if (!canUpdate) {
      return NextResponse.json(
        { error: "You can only update your own replies" },
        { status: 403 }
      );
    }

    // Update the reply
    const { data: updatedReply, error: updateError } = await supabaseAdmin
      .from("review_replies")
      .update({
        reply_text: replyText.trim(),
      })
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
      console.error("Error updating reply:", updateError);
      return NextResponse.json(
        { error: "Failed to update reply" },
        { status: 500 }
      );
    }

    // Add admin name to the response
    const adminName =
      profile.first_name && profile.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : profile.email;

    return NextResponse.json({
      success: true,
      message: "Reply updated successfully",
      reply: {
        ...updatedReply,
        admin_name: adminName,
      },
    });
  } catch (error) {
    console.error("Unexpected error in PUT /api/admin/reviews/replies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a reply
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
    const replyId = searchParams.get("id");

    if (!replyId) {
      return NextResponse.json(
        { error: "Reply ID is required" },
        { status: 400 }
      );
    }

    // Get the reply to check permissions
    const { data: existingReply, error: fetchError } = await supabaseAdmin
      .from("review_replies")
      .select("id, admin_id, review_id")
      .eq("id", replyId)
      .single();

    if (fetchError || !existingReply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    // Check if user can delete this reply
    const canDelete =
      profile.role === "super_admin" || existingReply.admin_id === user.id;
    if (!canDelete) {
      return NextResponse.json(
        { error: "You can only delete your own replies" },
        { status: 403 }
      );
    }

    // Delete the reply
    const { error: deleteError } = await supabaseAdmin
      .from("review_replies")
      .delete()
      .eq("id", replyId);

    if (deleteError) {
      console.error("Error deleting reply:", deleteError);
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
    console.error(
      "Unexpected error in DELETE /api/admin/reviews/replies:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
