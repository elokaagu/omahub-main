import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is super admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isSuperAdmin =
      profile?.role === "super_admin" ||
      user.email === "eloka.agu@icloud.com" ||
      user.email === "shannonalisa@oma-hub.com";

    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if platform is public by reading from the database
    const { data: visData, error: visError } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "platform_visibility")
      .single();
    if (visError && visError.code !== "PGRST116") {
      return NextResponse.json({ error: visError.message }, { status: 500 });
    }
    const isPublic = visData?.value === "public";
    return NextResponse.json({
      success: true,
      isPublic,
      status: isPublic ? "public" : "private",
    });
  } catch (error) {
    console.error("Platform status API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
