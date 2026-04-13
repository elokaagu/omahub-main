import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";
import { notifyAdminsOfNewProfile } from "@/lib/services/newAccountAdminNotification";
import {
  parseSignupCredentials,
  publicSignUpErrorMessage,
} from "@/lib/validation/signupCredentials";

export const dynamic = "force-dynamic";

/**
 * Server-side signup: Supabase Auth + ensure `profiles` row (idempotent insert).
 * Admin email uses `notifyAdminsOfNewProfile` (no self-HTTP, no default webhook secret).
 */
export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseSignupCredentials(json);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { email, password } = parsed.value;

  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error(
        JSON.stringify({
          event: "signup_auth_rejected",
          code: error.status,
        })
      );
      return NextResponse.json(
        { error: publicSignUpErrorMessage(error.message) },
        { status: 400 }
      );
    }

    if (!data.user?.id) {
      return NextResponse.json(
        { error: "Unable to create account. Please try again." },
        { status: 400 }
      );
    }

    const userId = data.user.id;
    const userEmail = data.user.email ?? email;
    const createdAt = new Date().toISOString();

    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      email: userEmail,
      role: "user",
      owned_brands: [],
      created_at: createdAt,
      updated_at: createdAt,
    });

    if (
      profileError &&
      profileError.code !== "23505" /* duplicate: trigger or retry */
    ) {
      console.error(
        JSON.stringify({
          event: "signup_profile_insert_failed",
          code: profileError.code,
        })
      );
    }

    await notifyAdminsOfNewProfile({
      id: userId,
      email: userEmail,
      role: "user",
      created_at: createdAt,
    });

    const sessionEstablished = Boolean(data.session);

    return NextResponse.json(
      {
        success: true,
        user: { id: userId, email: userEmail },
        sessionEstablished,
        message: sessionEstablished
          ? "Account created and signed in."
          : "Account created. Check your email to confirm before signing in.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "signup_unexpected",
        message: error instanceof Error ? error.message : String(error),
      })
    );
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
