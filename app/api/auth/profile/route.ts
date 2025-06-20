import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get authenticated user with better error handling
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.log("🔧 Auth error in profile API:", authError.message);

      // Handle specific JWT errors
      if (
        authError.message.includes("JWT") ||
        authError.message.includes("token")
      ) {
        return NextResponse.json(
          { error: "Invalid session - please sign in again" },
          {
            status: 401,
            headers: {
              "Clear-Site-Data": '"cookies"',
              "Set-Cookie": [
                "sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
                "sb-refresh-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
              ].join(", "),
            },
          }
        );
      }

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Profile API error:", error);

    // Handle cookie parsing errors specifically
    if (error instanceof Error && error.message.includes("cookie")) {
      return NextResponse.json(
        { error: "Session corrupted - please clear cookies and sign in again" },
        {
          status: 401,
          headers: {
            "Clear-Site-Data": '"cookies"',
          },
        }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
