import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Regular client for auth verification
const supabaseClient = createClient(
  supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get the session from cookies
    const cookieStore = cookies();
    const authCookie =
      cookieStore.get("sb-access-token") ||
      cookieStore.get("supabase-auth-token");

    if (!authCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the user is authenticated and is a super admin
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(authCookie.value);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
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
    const { data: users, error: usersError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

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

    // Get the session from cookies
    const cookieStore = cookies();
    const authCookie =
      cookieStore.get("sb-access-token") ||
      cookieStore.get("supabase-auth-token");

    if (!authCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the user is authenticated and is a super admin
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(authCookie.value);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
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
          owned_brands: owned_brands || [],
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

      return NextResponse.json({ user: updatedUser, action: "updated" });
    } else {
      // Create new user profile
      const { data: newUser, error: createError } = await supabaseAdmin
        .from("profiles")
        .insert({
          email,
          role,
          owned_brands: owned_brands || [],
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

      return NextResponse.json({ user: newUser, action: "created" });
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

    // Get the session from cookies
    const cookieStore = cookies();
    const authCookie =
      cookieStore.get("sb-access-token") ||
      cookieStore.get("supabase-auth-token");

    if (!authCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the user is authenticated and is a super admin
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(authCookie.value);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
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

    // Delete the user
    const { error: deleteError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete user" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in admin users DELETE API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
