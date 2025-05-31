import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Test 1: Check if we can connect to the database
    console.log("🔍 Testing database connection...");
    const { data: testData, error: testError } = await supabase
      .from("brands")
      .select("id")
      .limit(1);

    console.log("📊 Database test result:", { testData, testError });

    // Test 2: Check profiles table structure
    console.log("🔍 Testing profiles table...");
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .limit(5);

    console.log("📊 Profiles table test:", { profilesData, profilesError });

    // Test 3: Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    console.log("👤 Current user:", { user: user?.id, userError });

    // Test 4: Try to get specific user profile
    if (user?.id) {
      const { data: userProfile, error: userProfileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      console.log("👤 User profile:", { userProfile, userProfileError });
    }

    return NextResponse.json({
      databaseTest: { data: testData, error: testError },
      profilesTest: { data: profilesData, error: profilesError },
      currentUser: { user: user?.id, error: userError },
      userProfile: user?.id ? "checked above" : "no user",
    });
  } catch (error) {
    console.error("❌ Debug API error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, role } = await request.json();
    const supabase = createServerSupabaseClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    if (action === "update_role") {
      // Update user role
      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email,
          role: role || "admin",
          owned_brands: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (updateError) {
        console.error("❌ Error updating profile:", updateError);
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      console.log("✅ Profile updated:", updatedProfile);
      return NextResponse.json({
        success: true,
        profile: updatedProfile,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("❌ Debug API POST error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
