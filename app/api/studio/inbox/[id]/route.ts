import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const inquiryId = params.id;

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
      .select("role, owned_brands")
      .eq("id", user.id)
      .single();

    if (profileError || !profileData) {
      console.log(
        "⚠️ Profile not found, checking user email for super_admin access"
      );

      // Fallback: Check if user email indicates super_admin access (legacy support)
      const legacySuperAdmins = [
        "eloka.agu@icloud.com",
        "shannonalisa@oma-hub.com",
      ];
      
      if (legacySuperAdmins.includes(user.email || "")) {
        profile = {
          role: "super_admin",
          owned_brands: [],
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

    // Get inquiry with details
    let query = supabase
      .from("inquiries_with_details")
      .select("*")
      .eq("id", inquiryId);

    // Apply role-based filtering
    if (profile.role === "brand_admin") {
      if (!profile.owned_brands || profile.owned_brands.length === 0) {
        return NextResponse.json(
          { error: "No accessible brands" },
          { status: 403 }
        );
      }
      query = query.in("brand_id", profile.owned_brands);
    }

    const { data: inquiry, error } = await query.single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Inquiry not found" },
          { status: 404 }
        );
      }
      console.error("Error fetching inquiry:", error);
      return NextResponse.json(
        { error: "Failed to fetch inquiry" },
        { status: 500 }
      );
    }

    // Get replies for this inquiry
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
      console.error("Error fetching replies:", repliesError);
    }

    return NextResponse.json({
      inquiry,
      replies: replies || [],
    });
  } catch (error) {
    console.error("Get inquiry error:", error);
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
    const supabase = await createServerSupabaseClient();
    const inquiryId = params.id;

    console.log(`🗑️ DELETE request for inquiry: ${inquiryId}`);

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log("❌ Unauthorized delete attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    let profile;
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role, owned_brands")
      .eq("id", user.id)
      .single();

    if (profileError || !profileData) {
      console.log("⚠️ Profile not found, checking user email for super_admin access");

      // Fallback: Check if user email indicates super_admin access
      const legacySuperAdmins = [
        "eloka.agu@icloud.com",
        "shannonalisa@oma-hub.com",
      ];
      
      if (legacySuperAdmins.includes(user.email || "")) {
        profile = {
          role: "super_admin",
          owned_brands: [],
        };
        console.log("✅ Granted super_admin access based on email:", user.email);
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
      console.log("❌ Access denied for role:", profile.role);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Verify inquiry exists and user has access
    let verifyQuery = supabase
      .from("inquiries")
      .select("id, brand_id, customer_name")
      .eq("id", inquiryId);

    if (profile.role === "brand_admin") {
      if (!profile.owned_brands || profile.owned_brands.length === 0) {
        console.log("❌ Brand admin has no accessible brands");
        return NextResponse.json(
          { error: "No accessible brands" },
          { status: 403 }
        );
      }
      verifyQuery = verifyQuery.in("brand_id", profile.owned_brands);
    }

    const { data: existingInquiry, error: verifyError } =
      await verifyQuery.single();

    if (verifyError) {
      if (verifyError.code === "PGRST116") {
        console.log("❌ Inquiry not found:", inquiryId);
        return NextResponse.json(
          { error: "Inquiry not found" },
          { status: 404 }
        );
      }
      console.error("❌ Error verifying inquiry:", verifyError);
      return NextResponse.json(
        { error: "Failed to verify inquiry" },
        { status: 500 }
      );
    }

    console.log(`✅ Inquiry verified for deletion: ${existingInquiry.customer_name}`);

    // Delete any replies first
    console.log("🗑️ Deleting inquiry replies...");
    const { error: repliesDeleteError } = await supabase
      .from("inquiry_replies")
      .delete()
      .eq("inquiry_id", inquiryId);

    if (repliesDeleteError) {
      console.warn("⚠️ Warning: Could not delete replies:", repliesDeleteError.message);
      // Continue with inquiry deletion even if replies fail
    } else {
      console.log("✅ Inquiry replies deleted successfully");
    }

    // Delete the inquiry
    console.log("🗑️ Deleting inquiry from database...");
    const { error: deleteError } = await supabase
      .from("inquiries")
      .delete()
      .eq("id", inquiryId);

    if (deleteError) {
      console.error("❌ Failed to delete inquiry:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete inquiry" },
        { status: 500 }
      );
    }

    console.log(`✅ Inquiry ${inquiryId} deleted successfully from database`);

    return NextResponse.json({
      success: true,
      message: `Inquiry from ${existingInquiry.customer_name} deleted successfully`,
      deletedInquiryId: inquiryId,
    });

  } catch (error) {
    console.error("💥 Delete inquiry error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
      .select("role, owned_brands")
      .eq("id", user.id)
      .single();

    if (profileError || !profileData) {
      console.log(
        "⚠️ Profile not found, checking user email for super_admin access"
      );

      // Fallback: Check if user email indicates super_admin access (legacy support)
      const legacySuperAdmins = [
        "eloka.agu@icloud.com",
        "shannonalisa@oma-hub.com",
      ];
      
      if (legacySuperAdmins.includes(user.email || "")) {
        profile = {
          role: "super_admin",
          owned_brands: [],
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

    // Verify inquiry exists and user has access
    let verifyQuery = supabase
      .from("inquiries")
      .select("brand_id")
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

    const { data: existingInquiry, error: verifyError } =
      await verifyQuery.single();

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

    // Prepare update data
    const updateData: any = {};
    const { status, priority, readAt } = body;

    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (readAt !== undefined)
      updateData.read_at = readAt ? new Date().toISOString() : null;

    // Update inquiry
    const { data: updatedInquiry, error: updateError } = await supabase
      .from("inquiries")
      .update(updateData)
      .eq("id", inquiryId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating inquiry:", updateError);
      return NextResponse.json(
        { error: "Failed to update inquiry" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Inquiry updated successfully",
      inquiry: updatedInquiry,
    });
  } catch (error) {
    console.error("Update inquiry error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
