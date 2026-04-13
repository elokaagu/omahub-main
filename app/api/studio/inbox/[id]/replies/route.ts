import { NextRequest, NextResponse } from "next/server";
import { requireStudioInboxAccess } from "@/lib/auth/requireStudioInboxAccess";
import { sendInquiryReplyEmail } from "@/lib/services/emailService";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("🔍 GET Replies - Starting request for inquiry:", params.id);

    const auth = await requireStudioInboxAccess();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { profile, supabase } = auth;
    const inquiryId = params.id;

    // Verify inquiry exists and user has access
    let verifyQuery = supabase
      .from("inquiries")
      .select(
        `
        brand_id, 
        customer_email, 
        customer_name, 
        subject,
        message,
        brand:brands(name)
      `
      )
      .eq("id", inquiryId);

    if (profile.role === "brand_admin") {
      if (!profile.owned_brands || profile.owned_brands.length === 0) {
        console.error("❌ Brand admin has no owned brands");
        return NextResponse.json(
          { error: "No accessible brands" },
          { status: 403 }
        );
      }
      verifyQuery = verifyQuery.in("brand_id", profile.owned_brands);
      console.log(
        "🔒 Applied brand filter for brand_admin:",
        profile.owned_brands
      );
    }

    console.log("🔍 Verifying inquiry access...");
    const { data: inquiry, error: verifyError } = await verifyQuery.single();

    if (verifyError) {
      console.error("❌ Inquiry verification failed:", verifyError);
      if (verifyError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Inquiry not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Failed to verify inquiry" },
        { status: 500 }
      );
    }

    // Get replies
    console.log("📨 Fetching replies...");
    const { data: replies, error: repliesError } = await supabase
      .from("inquiry_replies")
      .select(
        `
        *,
        admin:profiles(first_name, last_name, email)
      `
      )
      .eq("inquiry_id", inquiryId)
      .order("created_at", { ascending: true });

    if (repliesError) {
      console.error("❌ Error fetching replies:", repliesError);
      return NextResponse.json(
        { error: "Failed to fetch replies" },
        { status: 500 }
      );
    }

    console.log("✅ Successfully fetched replies:", replies?.length || 0);
    return NextResponse.json({ replies: replies || [] });
  } catch (error) {
    console.error("💥 Get replies critical error:", error);
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
    const body = await request.json();

    const { message, isInternalNote = false } = body;

    if (!message || message.trim() === "") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Verify inquiry exists and user has access
    let verifyQuery = supabase
      .from("inquiries")
      .select(
        `
        brand_id, 
        customer_email, 
        customer_name, 
        subject,
        message,
        brand:brands(name)
      `
      )
      .eq("id", inquiryId);

    if (profile.role === "brand_admin") {
      if (!profile.owned_brands || profile.owned_brands.length === 0) {
        return NextResponse.json(
          { error: "No accessible brands" },
          { status: 403 }
        );
      }
      verifyQuery = verifyQuery.in("brand_id", profile.owned_brands);
    }

    const { data: inquiry, error: verifyError } = await verifyQuery.single();

    if (verifyError) {
      if (verifyError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Inquiry not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Failed to verify inquiry" },
        { status: 500 }
      );
    }

    // Create reply
    const { data: reply, error: replyError } = await supabase
      .from("inquiry_replies")
      .insert({
        inquiry_id: inquiryId,
        admin_id: userId,
        message: message.trim(),
        is_internal_note: isInternalNote,
      })
      .select(
        `
        *,
        admin:profiles(first_name, last_name, email)
      `
      )
      .single();

    if (replyError) {
      console.error("Error creating reply:", replyError);
      return NextResponse.json(
        { error: "Failed to create reply" },
        { status: 500 }
      );
    }

    // Update inquiry status if this is not an internal note
    if (!isInternalNote) {
      const updateData: any = {
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
          customerName: inquiry.customer_name,
          customerEmail: inquiry.customer_email,
          originalSubject: inquiry.subject,
          originalMessage: inquiry.message,
          replyMessage: message.trim(),
          brandName: (inquiry.brand as any)?.name || "OmaHub",
          adminName: adminName,
          isFromSuperAdmin: profile.role === "super_admin",
        });

        if (emailResult.success) {
          console.log(
            "✅ Reply email sent successfully to:",
            inquiry.customer_email
          );
        } else {
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
    console.error("Create reply error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
