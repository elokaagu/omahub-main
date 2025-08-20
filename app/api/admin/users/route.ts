import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to create authenticated supabase client
function createAuthenticatedClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    // Create authenticated client
    const supabase = createAuthenticatedClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Fetch all users using service role (bypasses RLS)
    // Only select essential fields to reduce payload size
    const { data: users, error: usersError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, role, owned_brands, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users", details: usersError.message },
        { status: 500 }
      );
    }

    // Add basic validation
    if (!users || users.length === 0) {
      console.log("No users found in database");
      return NextResponse.json({ users: [] });
    }

    console.log(`✅ Successfully fetched ${users.length} users`);
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error in admin users API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role, owned_brands } = body;

    // Create authenticated client
    const supabase = createAuthenticatedClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // If the user is being assigned super_admin role, automatically assign all brands
    // IMPORTANT: For super_admin, we ALWAYS assign all brands regardless of form input
    let finalOwnedBrands: string[] = [];

    if (role === "super_admin") {
      // Fetch all brand IDs
      const { data: allBrands, error: brandsError } = await supabaseAdmin
        .from("brands")
        .select("id");

      if (brandsError) {
        console.error(
          "❌ Error fetching brands for auto-assignment:",
          brandsError
        );
        return NextResponse.json(
          { error: "Failed to fetch brands for super admin assignment" },
          { status: 500 }
        );
      } else {
        const allBrandIds = allBrands.map((brand) => brand.id);
        finalOwnedBrands = allBrandIds;
      }
    } else {
      // For non-super-admin roles, use the brands from the form
      finalOwnedBrands = owned_brands || [];
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking user:", checkError);
      return NextResponse.json(
        { error: "Error checking if user exists" },
        { status: 500 }
      );
    }

    if (existingUser) {
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          role,
          owned_brands: finalOwnedBrands,
          updated_at: new Date().toISOString(),
        })
        .eq("email", email)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating user:", updateError);
        return NextResponse.json(
          { error: "Failed to update user" },
          { status: 500 }
        );
      }

      // Trigger real-time profile refresh for the updated user
      // Only send real-time notification if the updated user is not the current admin
      // This prevents the admin from logging themselves out when assigning roles
      if (updatedUser.id !== user.id) {
        try {
          await supabaseAdmin
            .channel(`profile_updates_${updatedUser.id}`)
            .send({
              type: "broadcast",
              event: "profile_updated",
              payload: {
                user_id: updatedUser.id,
                email: updatedUser.email,
                role: updatedUser.role,
                owned_brands: updatedUser.owned_brands,
                updated_at: updatedUser.updated_at,
                trigger: "admin_update",
              },
            });

        } catch (realtimeError) {
          console.warn(
            "⚠️ Failed to send real-time profile update:",
            realtimeError
          );
          // Don't fail the request if real-time notification fails
        }
      }

      // Validate that super_admin users have all brands assigned
      if (role === "super_admin") {
        const { data: totalBrands, error: countError } = await supabaseAdmin
          .from("brands")
          .select("id", { count: "exact" });

        if (
          !countError &&
          totalBrands &&
          finalOwnedBrands.length !== totalBrands.length
        ) {
          console.error(
            `🚨 Super admin validation failed: Expected ${totalBrands.length} brands, got ${finalOwnedBrands.length}`
          );
          return NextResponse.json(
            { error: "Super admin brand assignment validation failed" },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        user: updatedUser,
        action: "updated",
        autoAssignedBrands:
          role === "super_admin" ? finalOwnedBrands.length : 0,
        profileRefreshTriggered: true,
        validation: role === "super_admin" ? "passed" : "not_applicable",
      });
    } else {
      // Create new user profile
      const { data: newUser, error: createError } = await supabaseAdmin
        .from("profiles")
        .insert({
          email,
          role,
          owned_brands: finalOwnedBrands,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating user:", createError);
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }

      // Validate that super_admin users have all brands assigned
      if (role === "super_admin") {
        const { data: totalBrands, error: countError } = await supabaseAdmin
          .from("brands")
          .select("id", { count: "exact" });

        if (
          !countError &&
          totalBrands &&
          finalOwnedBrands.length !== totalBrands.length
        ) {
          console.error(
            `🚨 Super admin validation failed: Expected ${totalBrands.length} brands, got ${finalOwnedBrands.length}`
          );
          return NextResponse.json(
            { error: "Super admin brand assignment validation failed" },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        user: newUser,
        action: "created",
        autoAssignedBrands:
          role === "super_admin" ? finalOwnedBrands.length : 0,
        validation: role === "super_admin" ? "passed" : "not_applicable",
      });
    }
  } catch (error) {
    console.error("Error in admin users POST API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Create authenticated client
    const supabase = createAuthenticatedClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get the user's email before deletion for logging
    const { data: userToDelete, error: getUserError } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    if (getUserError) {
      console.error("Error fetching user to delete:", getUserError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete from auth.users table first (this will cascade to profiles due to foreign key)
    const { error: authDeleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error("Error deleting user from auth:", authDeleteError);
      return NextResponse.json(
        { error: "Failed to delete user from authentication system" },
        { status: 500 }
      );
    }

    // The profiles record should be automatically deleted due to CASCADE foreign key,
    // but let's ensure it's deleted just in case
    const { error: profileDeleteError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileDeleteError) {
      console.warn(
        "Warning: Profile deletion error (may already be deleted by CASCADE):",
        profileDeleteError
      );
      // Don't fail the request since the auth deletion succeeded
    }

    return NextResponse.json({
      success: true,
      message: `User ${userToDelete.email} has been completely deleted from both authentication and profile systems`,
    });
  } catch (error) {
    console.error("Error in admin users DELETE API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
