import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";
import { SELF_PROFILE_SELECT } from "@/lib/auth/selfProfile";
import {
  corruptedSessionResponse,
  isJwtLikeAuthError,
} from "@/lib/auth/sessionInvalidation";

export const dynamic = "force-dynamic";

/** Current user's profile row (narrow columns). Session from unified SSR client. */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      if (isJwtLikeAuthError(authError.message)) {
        return corruptedSessionResponse(supabase);
      }
      console.error(
        JSON.stringify({
          event: "profile_get_user_failed",
          message: authError.message,
        })
      );
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(SELF_PROFILE_SELECT)
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        JSON.stringify({
          event: "profile_row_fetch_failed",
          code: profileError.code,
        })
      );
      return NextResponse.json(
        { error: "Failed to load profile" },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.toLowerCase().includes("cookie")) {
      try {
        const supabase = await createServerSupabaseClient();
        return await corruptedSessionResponse(supabase);
      } catch {
        return NextResponse.json(
          { error: "Session invalid. Please sign in again." },
          {
            status: 401,
            headers: { "Clear-Site-Data": '"cookies"' },
          }
        );
      }
    }

    console.error(
      JSON.stringify({ event: "profile_route_unexpected", message: msg })
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
