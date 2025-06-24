import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";
import { sendInquiryReplyEmail } from "@/lib/services/emailService";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("🔍 GET Replies - Starting request for inquiry:", params.id);

    const supabase = await createServerSupabaseClient();
    const inquiryId = params.id;

    console.log("✅ Supabase client created successfully");

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("🔐 Auth check result:", {
      hasUser: !!user,
      userEmail: user?.email,
      authError: authError?.message,
    });

    if (authError || !user) {
      console.error("❌ Authentication failed:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile with fallback for super_admin users
    let profile;
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role, owned_brands")
      .eq("id", user.id)
      .single();

    console.log("👤 Profile check result:", {
      hasProfile: !!profileData,
      role: profileData?.role,
      ownedBrands: profileData?.owned_brands,
      profileError: profileError?.message,
    });

    if (profileError || !profileData) {
      console.log(
        "⚠️ Profile not found, checking user email for super_admin access"
      );

      // Fallback: Check if user email indicates super_admin access
      if (
        user.email === "eloka.agu@icloud.com" ||
        user.email === "shannonalisa@oma-hub.com"
      ) {
        profile = {
          role: "super_admin",
          owned_brands: [],
        };
        console.log(
          "✅ Granted super_admin access based on email:",
          user.email
        );
      } else {
        console.error("❌ Profile error:", profileError);
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 404 }
        );
      }
    } else {
      profile = profileData;
    }

    // Check permissions
    if (!["super_admin", "brand_admin"].includes(profile.role)) {
      console.error("❌ Access denied for role:", profile.role);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    console.log("✅ Permission check passed for role:", profile.role);

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

    console.log("✅ Inquiry verified:", {
      brandId: inquiry.brand_id,
      customerEmail: inquiry.customer_email,
    });

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
    const supabase = await createServerSupabaseClient();
    const inquiryId = params.id;
    const body = await request.json();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile with fallback for super_admin users
    let profile;
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role, owned_brands, first_name, last_name, email")
      .eq("id", user.id)
      .single();

    if (profileError || !profileData) {
      console.log(
        "⚠️ Profile not found, checking user email for super_admin access"
      );

      // Fallback: Check if user email indicates super_admin access
      if (
        user.email === "eloka.agu@icloud.com" ||
        user.email === "shannonalisa@oma-hub.com"
      ) {
        profile = {
          role: "super_admin",
          owned_brands: [],
          first_name: null,
          last_name: null,
          email: user.email,
        };
        console.log(
          "✅ Granted super_admin access based on email:",
          user.email
        );
      } else {
        console.error("Profile error:", profileError);
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 404 }
        );
      }
    } else {
      profile = profileData;
    }

    // Check permissions
    if (!["super_admin", "brand_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

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
        admin_id: user.id,
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
            : profile.email || "OmaHub Team";

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
