import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
} as const;

function json(
  body: Record<string, unknown>,
  init: { status: number }
): NextResponse {
  return NextResponse.json(body, {
    status: init.status,
    headers: NO_STORE_HEADERS,
  });
}

/**
 * Server-side session + optional `profiles` row (`profile_exists`, role from DB).
 * For a minimal JWT check and `{ id, email }` only, see `GET /api/auth/verify`.
 * Does not expose raw provider errors; internals are logged as structured events only.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error(
        JSON.stringify({
          event: "validate_user_error",
          message: userError.message,
        })
      );
      return json(
        { valid: false, error: "Session could not be verified." },
        { status: 401 }
      );
    }

    if (!user?.id) {
      return json({ valid: false, error: "Not signed in." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        JSON.stringify({
          event: "validate_profile_fetch_failed",
          code: profileError.code,
          message: profileError.message,
        })
      );
      return json(
        { valid: false, error: "Unable to verify account." },
        { status: 500 }
      );
    }

    // Expiry is not returned here to avoid getSession() on the server (see Supabase SSR guidance).
    const session_expires = null;

    if (!profile) {
      return json(
        {
          valid: true,
          user: {
            id: user.id,
            email: user.email,
            role: "user",
          },
          session_expires,
          profile_exists: false,
        },
        { status: 200 }
      );
    }

    return json(
      {
        valid: true,
        user: {
          id: profile.id,
          email: profile.email,
          role: profile.role,
        },
        session_expires,
        profile_exists: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "validate_unexpected",
        message: error instanceof Error ? error.message : String(error),
      })
    );
    return json(
      { valid: false, error: "Validation failed." },
      { status: 500 }
    );
  }
}
