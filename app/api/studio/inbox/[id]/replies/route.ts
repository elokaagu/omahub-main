import { NextRequest, NextResponse } from "next/server";
import { requireStudioInboxAccess } from "@/lib/auth/requireStudioInboxAccess";
import { sendInquiryReplyEmail } from "@/lib/services/emailService";

const INQUIRY_SELECT_FIELDS = `
  brand_id,
  customer_email,
  customer_name,
  subject,
  message,
  brand:brands(name)
`;

const REPLY_SELECT_FIELDS = `
  id,
  inquiry_id,
  admin_id,
  message,
  is_internal_note,
  created_at,
  admin:profiles(first_name, last_name, email)
`;

type InquiryData = {
  brand_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  subject: string | null;
  message: string | null;
  brand: { name?: string | null } | null;
};

async function verifyAccessibleInquiry(
  supabase: any,
  profile: { role: string; owned_brands?: string[] | null },
  inquiryId: string
): Promise<
  | { ok: true; inquiry: InquiryData }
  | { ok: false; response: NextResponse }
> {
  let verifyQuery = supabase
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
    verifyQuery = verifyQuery.in("brand_id", profile.owned_brands);
  }

  const { data: inquiry, error: verifyError } = await verifyQuery.single();
  if (verifyError) {
    if (verifyError.code === "PGRST116") {
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

  return { ok: true, inquiry: inquiry as InquiryData };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireStudioInboxAccess();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { profile, supabase } = auth;
    const inquiryId = params.id;

    const verification = await verifyAccessibleInquiry(supabase, profile, inquiryId);
    if (!verification.ok) return verification.response;

    // Get replies
    const { data: replies, error: repliesError } = await supabase
      .from("inquiry_replies")
      .select(REPLY_SELECT_FIELDS)
      .eq("inquiry_id", inquiryId)
      .order("created_at", { ascending: true });

    if (repliesError) {
      console.error("❌ Error fetching replies:", repliesError.code);
      return NextResponse.json(
        { error: "Failed to fetch replies" },
        { status: 500 }
      );
    }

    return NextResponse.json({ replies: replies || [] });
  } catch (error) {
    console.error("💥 Get replies critical error:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireStudioInboxAccess();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { userId, userEmail, profile, supabase } = auth;
    const inquiryId = params.id;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { message, isInternalNote = false } = body as {
      message?: unknown;
      isInternalNote?: unknown;
    };

    if (typeof message !== "string" || message.trim() === "") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }
    if (message.trim().length > 5000) {
      return NextResponse.json(
        { error: "Message must be 5000 characters or fewer" },
        { status: 400 }
      );
    }
    if (typeof isInternalNote !== "boolean") {
      return NextResponse.json(
        { error: "isInternalNote must be a boolean" },
        { status: 400 }
      );
    }

    const verification = await verifyAccessibleInquiry(supabase, profile, inquiryId);
    if (!verification.ok) return verification.response;
    const inquiry = verification.inquiry;

    // Create reply
    const { data: reply, error: replyError } = await supabase
      .from("inquiry_replies")
      .insert({
        inquiry_id: inquiryId,
        admin_id: userId,
        message: message.trim(),
        is_internal_note: isInternalNote,
      })
      .select(REPLY_SELECT_FIELDS)
      .single();

    if (replyError) {
      console.error("Error creating reply:", replyError.code);
      return NextResponse.json(
        { error: "Failed to create reply" },
        { status: 500 }
      );
    }

    // Update inquiry status if this is not an internal note
    if (!isInternalNote) {
      const updateData: { status: string; replied_at: string } = {
        status: "replied",
        replied_at: new Date().toISOString(),
      };

      await supabase.from("inquiries").update(updateData).eq("id", inquiryId);

      // Send email notification to customer
      try {
        const adminName =
          profile.first_name && profile.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : profile.email || userEmail || "OmaHub Team";

        const emailResult = await sendInquiryReplyEmail({
          customerName: inquiry.customer_name || "Customer",
          customerEmail: inquiry.customer_email || "",
          originalSubject: inquiry.subject || "Your inquiry",
          originalMessage: inquiry.message || "",
          replyMessage: message.trim(),
          brandName: inquiry.brand?.name || "OmaHub",
          adminName: adminName,
          isFromSuperAdmin: profile.role === "super_admin",
        });

        if (!emailResult.success) {
          console.error("❌ Failed to send reply email:", emailResult.error);
          // Don't fail the reply creation if email fails
        }
      } catch (emailError) {
        console.error("❌ Error sending reply email:", emailError);
        // Don't fail the reply creation if email fails
      }
    }

    return NextResponse.json({
      message: "Reply created successfully",
      reply,
    });
  } catch (error) {
    console.error("Create reply error:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
