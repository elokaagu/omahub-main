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

    // Check if platform is public by looking for the cookie
    const isPublic = request.cookies.get("omahub-public")?.value === "true";

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
