import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const inquiryId = params.id;
    console.log("🔍 Fetching inquiry with ID:", inquiryId);
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, owned_brands")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check permissions
    if (!["super_admin", "brand_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Build query for inquiry
    let query = supabase
      .from("inquiries")
      .select(`
        *,
        brand:brands(name, category),
        replies:inquiry_replies(*)
      `)
      .eq("id", inquiryId);

    // Apply role-based filtering
    if (profile.role === "brand_admin" && profile.owned_brands?.length > 0) {
      query = query.in("brand_id", profile.owned_brands);
    }

    const { data: inquiry, error } = await query.single();

    console.log("🔍 Inquiry query result:", { inquiry, error });

    if (error) {
      console.error("❌ Inquiry fetch error:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Failed to fetch inquiry" },
        { status: 500 }
      );
    }

    console.log("✅ Inquiry fetched successfully:", inquiry?.id);
    return NextResponse.json({ success: true, inquiry });
  } catch (error) {
    console.error("💥 Get inquiry error:", error);
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
    const body = await request.json();
    const { status, is_read, reply } = body;

    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, owned_brands")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check permissions
    if (!["super_admin", "brand_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Verify inquiry exists and user has access
    let verifyQuery = supabase
      .from("inquiries")
      .select("id, brand_id, customer_name")
      .eq("id", inquiryId);

    if (profile.role === "brand_admin" && profile.owned_brands?.length > 0) {
      verifyQuery = verifyQuery.in("brand_id", profile.owned_brands);
    }

    const { data: existingInquiry, error: verifyError } = await verifyQuery.single();

    if (verifyError) {
      if (verifyError.code === "PGRST116") {
        return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Failed to verify inquiry" },
        { status: 500 }
      );
    }

    // Update the inquiry
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (is_read !== undefined) updateData.is_read = is_read;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedInquiry, error: updateError } = await supabase
      .from("inquiries")
      .update(updateData)
      .eq("id", inquiryId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update inquiry" },
        { status: 500 }
      );
    }

    // Add reply if provided
    if (reply) {
      // Get the full inquiry details for email
      const { data: inquiryDetails, error: inquiryError } = await supabase
        .from("inquiries")
        .select(`
          *,
          brand:brands(name, contact_email)
        `)
        .eq("id", inquiryId)
        .single();

      if (inquiryError) {
        console.error("❌ Failed to get inquiry details for email:", inquiryError);
      } else {
        // Send email to customer
        try {
          const emailResponse = await fetch("/api/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: inquiryDetails.customer_email,
              subject: `Re: ${inquiryDetails.subject}`,
              template: "inquiry-reply",
              data: {
                customerName: inquiryDetails.customer_name,
                brandName: inquiryDetails.brand?.name || "OmaHub",
                adminName: "OmaHub Admin",
                replyMessage: reply,
                originalMessage: inquiryDetails.message,
                inquiryId: inquiryId,
              },
            }),
          });

          if (!emailResponse.ok) {
            console.warn("⚠️ Failed to send reply email");
          } else {
            console.log("✅ Reply email sent successfully to:", inquiryDetails.customer_email);
          }
        } catch (emailError) {
          console.error("❌ Email sending error:", emailError);
        }
      }

      // Save reply to database
      const { error: replyError } = await supabase
        .from("inquiry_replies")
        .insert({
          inquiry_id: inquiryId,
          user_id: user.id,
          message: reply,
          is_brand_reply: profile.role === "brand_admin",
        });

      if (replyError) {
        console.warn("⚠️ Failed to add reply:", replyError);
      }
    }

    return NextResponse.json({
      success: true,
      inquiry: updatedInquiry,
    });
  } catch (error) {
    console.error("💥 Update inquiry error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const inquiryId = params.id;
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, owned_brands")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check permissions
    if (!["super_admin", "brand_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Verify inquiry exists and user has access
    let verifyQuery = supabase
      .from("inquiries")
      .select("id, brand_id, customer_name")
      .eq("id", inquiryId);

    if (profile.role === "brand_admin" && profile.owned_brands?.length > 0) {
      verifyQuery = verifyQuery.in("brand_id", profile.owned_brands);
    }

    const { data: existingInquiry, error: verifyError } = await verifyQuery.single();

    if (verifyError) {
      if (verifyError.code === "PGRST116") {
        return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Failed to verify inquiry" },
        { status: 500 }
      );
    }

    // Delete associated replies first
    const { error: repliesError } = await supabase
      .from("inquiry_replies")
      .delete()
      .eq("inquiry_id", inquiryId);

    if (repliesError) {
      console.warn("⚠️ Warning: Failed to delete inquiry replies:", repliesError);
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
    console.error("💥 Delete inquiry error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
