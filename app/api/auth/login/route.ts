import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { parseLoginCredentials } from "@/lib/validation/loginCredentials";

type ProfileRoleResult =
  | { ok: true; role: string }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "db_error" };

/**
 * Role from `profiles` for the authenticated auth user id (not request email).
 */
async function getProfileRoleByUserId(userId: string): Promise<ProfileRoleResult> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Login: profile role query failed", error.code, error.message);
    return { ok: false, reason: "db_error" };
  }

  if (!data?.role) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true, role: data.role };
}

export async function POST(request: NextRequest) {
  try {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = parseLoginCredentials(json);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { email, password } = parsed.value;

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login: signInWithPassword failed", error.message);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    const roleResult = await getProfileRoleByUserId(data.user.id);

    if (roleResult.ok === false && roleResult.reason === "db_error") {
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    const missingProfile = roleResult.ok === false && roleResult.reason === "not_found";
    const role = roleResult.ok ? roleResult.role : null;

    const response = NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email ?? email,
      },
      role,
      missingProfile,
      message: "Login successful",
      refreshSession: true,
    });

    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    console.error("Login: unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
