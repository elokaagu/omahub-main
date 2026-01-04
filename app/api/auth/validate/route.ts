import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session validation error:", sessionError);
      return NextResponse.json(
        {
          valid: false,
          error: "Session error",
          details: sessionError.message,
        },
        { status: 401 }
      );
    }

    if (!session?.user) {
      return NextResponse.json(
        {
          valid: false,
          error: "No session found",
        },
        { status: 401 }
      );
    }

    // Validate user exists in database
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role")
      .eq("id", session.user.id)
      .single();

    if (profileError) {
      // User might not have a profile yet, but session is valid
      return NextResponse.json({
        valid: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          role: "user", // default role
        },
        session_expires: session.expires_at,
        profile_exists: false,
      });
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
      },
      session_expires: session.expires_at,
      profile_exists: true,
    });
  } catch (error) {
    console.error("Session validation failed:", error);
    return NextResponse.json(
      {
        valid: false,
        error: "Validation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
