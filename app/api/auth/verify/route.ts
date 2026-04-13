import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

export const dynamic = "force-dynamic";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
} as const;

/**
 * Minimal auth ping: validates the session JWT via `getUser()` and returns
 * `{ id, email }` only. For `profile_exists`, DB role, and expiry, prefer
 * `GET /api/auth/validate` (canonical richer contract).
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error(
        JSON.stringify({
          event: "verify_get_user_failed",
          message: error.message,
        })
      );
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: NO_STORE }
      );
    }

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: NO_STORE }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: { id: user.id, email: user.email ?? null },
      },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "verify_unexpected",
        message: error instanceof Error ? error.message : String(error),
      })
    );
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500, headers: NO_STORE }
    );
  }
}
