import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

export async function POST(request: NextRequest) {
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

    // Set platform_visibility to 'private' in the database
    const { error: dbError } = await supabase.from("platform_settings").upsert(
      [
        {
          key: "platform_visibility",
          value: "private",
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "key" }
    );
    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    // (Optional) Remove the public cookie for legacy support
    const response = NextResponse.json({
      success: true,
      message: "Password gate enabled. Platform is now private.",
    });
    response.cookies.set("omahub-public", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Enable password gate API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
