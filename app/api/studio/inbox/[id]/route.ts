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
    console.log(`🗑️ DELETE request received for inquiry ID: ${params.id}`);
    const supabase = await createServerSupabaseClient();
    const inquiryId = params.id;

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("❌ Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(`👤 Authenticated user: ${user.id} (${user.email})`);

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
      console.log(
        `👤 User profile: role=${profile.role}, brands=${JSON.stringify(profile.owned_brands)}`
      );
    }

    // Check permissions
    if (!["super_admin", "brand_admin"].includes(profile.role)) {
      console.error("❌ Access denied: role not allowed");
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Verify inquiry exists and user has access
    console.log(`🔍 Verifying inquiry exists and user has access...`);
    let verifyQuery = supabase
      .from("inquiries")
      .select("brand_id, customer_name")
      .eq("id", inquiryId);

    if (profile.role === "brand_admin") {
      if (!profile.owned_brands || profile.owned_brands.length === 0) {
        console.error("❌ No accessible brands for brand_admin");
        return NextResponse.json(
          { error: "No accessible brands" },
          { status: 403 }
        );
      }
      verifyQuery = verifyQuery.in("brand_id", profile.owned_brands);
      console.log(
        `🔍 Filtering by brand IDs: ${JSON.stringify(profile.owned_brands)}`
      );
    }

    const { data: inquiry, error: verifyError } = await verifyQuery.single();

    if (verifyError) {
      if (verifyError.code === "PGRST116") {
        console.error("❌ Inquiry not found during verification");
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
    console.log(
      `✅ Inquiry verified: ${inquiry.customer_name} (brand: ${inquiry.brand_id})`
    );

    // Delete inquiry replies first (cascade delete)
    console.log(`🗑️ Deleting inquiry replies for inquiry ID: ${inquiryId}`);
    const { error: repliesError } = await supabase
      .from("inquiry_replies")
      .delete()
      .eq("inquiry_id", inquiryId);

    if (repliesError) {
      console.error("❌ Error deleting inquiry replies:", repliesError);
      return NextResponse.json(
        { error: "Failed to delete inquiry replies" },
        { status: 500 }
      );
    }
    console.log(`✅ Inquiry replies deleted successfully`);

    // Delete the inquiry
    console.log(`🗑️ Deleting inquiry with ID: ${inquiryId}`);
    const { data: deleteResult, error: deleteError } = await supabase
      .from("inquiries")
      .delete()
      .eq("id", inquiryId)
      .select(); // Add select to see what was actually deleted

    if (deleteError) {
      console.error("❌ Error deleting inquiry:", deleteError);
      console.error("❌ Delete error details:", {
        code: deleteError.code,
        message: deleteError.message,
        details: deleteError.details,
        hint: deleteError.hint,
      });
      return NextResponse.json(
        { error: "Failed to delete inquiry" },
        { status: 500 }
      );
    }

    console.log(`✅ Inquiry delete result:`, deleteResult);
    console.log(`✅ Inquiry deleted successfully from database`);

    // Verify deletion by trying to fetch the inquiry again
    console.log(
      `🔍 Verifying deletion by attempting to fetch inquiry again...`
    );
    const { data: verifyDelete, error: verifyDeleteError } = await supabase
      .from("inquiries")
      .select("id")
      .eq("id", inquiryId)
      .single();

    if (verifyDeleteError && verifyDeleteError.code === "PGRST116") {
      console.log(`✅ Deletion verified: Inquiry no longer exists in database`);

      // Only return success if deletion was actually verified
      console.log(
        `✅ Deleted inquiry ${inquiryId} from ${inquiry.customer_name}`
      );

      return NextResponse.json({
        success: true,
        message: "Inquiry deleted successfully",
      });
    } else if (verifyDelete) {
      console.error(
        `⚠️ WARNING: Inquiry still exists after deletion!`,
        verifyDelete
      );
      console.error(
        `⚠️ This suggests RLS policies or database constraints are preventing deletion`
      );

      // Let's check if there are any foreign key constraints or other issues
      console.log(`🔍 Checking for potential database constraints...`);
      try {
        // Check if there are any other tables that might reference this inquiry
        const { data: references, error: refError } = await supabase
          .from("inquiry_replies")
          .select("id")
          .eq("inquiry_id", inquiryId)
          .limit(1);

        if (refError) {
          console.log(`📊 Inquiry replies check error:`, refError);
        } else {
          console.log(
            `📊 Remaining inquiry replies: ${references?.length || 0}`
          );
        }

        // Check if there are any other potential references
        console.log(
          `🔍 This might be an RLS policy issue. Checking user permissions...`
        );
        console.log(`🔍 Current user: ${user.id}, Role: ${profile.role}`);

        // Return error since deletion failed
        return NextResponse.json(
          {
            error:
              "Inquiry deletion failed - inquiry still exists in database. This may be due to RLS policies or database constraints.",
            details:
              "The DELETE operation appeared to succeed but the inquiry was not actually removed from the database.",
          },
          { status: 500 }
        );
      } catch (constraintError) {
        console.log(`📊 Constraint check error:`, constraintError);

        // Return error since deletion failed
        return NextResponse.json(
          {
            error:
              "Inquiry deletion failed - unable to verify deletion success",
            details:
              "The DELETE operation appeared to succeed but verification failed.",
          },
          { status: 500 }
        );
      }
    } else {
      console.log(`✅ Deletion verification completed`);

      // Return success if verification passed
      console.log(
        `✅ Deleted inquiry ${inquiryId} from ${inquiry.customer_name}`
      );

      return NextResponse.json({
        success: true,
        message: "Inquiry deleted successfully",
      });
    }
  } catch (error) {
    console.error("Delete inquiry error:", error);
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
