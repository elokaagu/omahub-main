import { NextRequest, NextResponse } from "next/server";
import { requireStudioInboxAccess } from "@/lib/auth/requireStudioInboxAccess";

const INQUIRY_SELECT_FIELDS = `
  id,
  brand_id,
  customer_name,
  customer_email,
  subject,
  message,
  status,
  is_read,
  created_at,
  updated_at,
  replied_at,
  brand:brands(name, category),
  replies:inquiry_replies(
    id,
    inquiry_id,
    admin_id,
    message,
    is_internal_note,
    created_at
  )
`;

const VALID_INQUIRY_STATUSES = ["new", "pending", "replied", "closed"] as const;

type InboxProfile = {
  role: string;
  owned_brands?: string[] | null;
};

async function verifyAccessibleInquiry(
  supabase: any,
  profile: InboxProfile,
  inquiryId: string
): Promise<
  | { ok: true; inquiry: any }
  | { ok: false; response: NextResponse }
> {
  let query = supabase
    .from("inquiries")
    .select(INQUIRY_SELECT_FIELDS)
    .eq("id", inquiryId);

  if (profile.role === "brand_admin") {
    if (!profile.owned_brands || profile.owned_brands.length === 0) {
      return {
        ok: false,
        response: NextResponse.json({ error: "No accessible brands" }, { status: 403 }),
      };
    }
    query = query.in("brand_id", profile.owned_brands);
  }

  const { data: inquiry, error } = await query.single();
  if (error) {
    if (error.code === "PGRST116") {
      return {
        ok: false,
        response: NextResponse.json({ error: "Inquiry not found" }, { status: 404 }),
      };
    }
    return {
      ok: false,
      response: NextResponse.json({ error: "Failed to verify inquiry" }, { status: 500 }),
    };
  }

  return { ok: true, inquiry };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const inquiryId = params.id;
    const auth = await requireStudioInboxAccess();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { profile, supabase } = auth;

    const verification = await verifyAccessibleInquiry(
      supabase,
      profile as InboxProfile,
      inquiryId
    );
    if (!verification.ok) return verification.response;
    const inquiry = verification.inquiry;

    return NextResponse.json({ success: true, inquiry });
  } catch (error) {
    console.error("💥 Get inquiry error:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const inquiryId = params.id;
    const auth = await requireStudioInboxAccess();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { profile, supabase } = auth;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { status, is_read, reply } = body as {
      status?: unknown;
      is_read?: unknown;
      reply?: unknown;
    };

    // Keep reply creation in the dedicated /replies route
    if (reply !== undefined) {
      return NextResponse.json(
        { error: "Use /api/studio/inbox/[id]/replies to create replies" },
        { status: 400 }
      );
    }

    if (status !== undefined && !VALID_INQUIRY_STATUSES.includes(status as (typeof VALID_INQUIRY_STATUSES)[number])) {
      return NextResponse.json({ error: "Invalid inquiry status" }, { status: 400 });
    }
    if (is_read !== undefined && typeof is_read !== "boolean") {
      return NextResponse.json({ error: "is_read must be a boolean" }, { status: 400 });
    }

    const verification = await verifyAccessibleInquiry(
      supabase,
      profile as InboxProfile,
      inquiryId
    );
    if (!verification.ok) return verification.response;

    // Update the inquiry
    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (is_read !== undefined) updateData.is_read = is_read;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedInquiry, error: updateError } = await supabase
      .from("inquiries")
      .update(updateData)
      .eq("id", inquiryId)
      .select(INQUIRY_SELECT_FIELDS)
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update inquiry" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inquiry: updatedInquiry,
    });
  } catch (error) {
    console.error("💥 Update inquiry error:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const inquiryId = params.id;
    const auth = await requireStudioInboxAccess();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { profile, supabase } = auth;

    const verification = await verifyAccessibleInquiry(
      supabase,
      profile as InboxProfile,
      inquiryId
    );
    if (!verification.ok) return verification.response;

    // Delete associated replies first
    const { error: repliesError } = await supabase
      .from("inquiry_replies")
      .delete()
      .eq("inquiry_id", inquiryId);

    if (repliesError) {
      console.warn("⚠️ Warning: Failed to delete inquiry replies:", repliesError.code);
    }

    // Delete the inquiry
    const { error: deleteError } = await supabase
      .from("inquiries")
      .delete()
      .eq("id", inquiryId);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete inquiry" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Inquiry deleted successfully",
    });
  } catch (error) {
    console.error("💥 Delete inquiry error:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
