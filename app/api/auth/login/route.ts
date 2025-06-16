import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SUPER_ADMIN_EMAILS = ["eloka.agu@icloud.com", "shannonalisa@oma-hub.com"];
const BRAND_ADMIN_EMAILS = ["eloka@culturin.com"];

function getUserRole(email: string): string {
  if (SUPER_ADMIN_EMAILS.includes(email)) return "super_admin";
  if (BRAND_ADMIN_EMAILS.includes(email)) return "brand_admin";
  return "user";
}

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  console.log("🔐 Login attempt for:", email);

  if (!email || !password) {
    console.log("❌ Missing email or password");
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  try {
    console.log("🔄 Attempting Supabase authentication...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("❌ Supabase auth error:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });

      // Provide more specific error messages
      let errorMessage = error.message;

      if (error.message?.toLowerCase().includes("invalid login credentials")) {
        errorMessage =
          "Invalid email or password. Please check your credentials and try again.";
      } else if (error.message?.toLowerCase().includes("email not confirmed")) {
        errorMessage =
          "Please check your email and click the confirmation link before signing in.";
      } else if (error.message?.toLowerCase().includes("too many requests")) {
        errorMessage =
          "Too many login attempts. Please wait a few minutes before trying again.";
      }

      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }

    console.log("✅ Supabase authentication successful for:", data.user.email);

    // Check if profile exists and create if not - use upsert for efficiency
    const userRole = getUserRole(data.user.email || "");

    console.log("🔄 Upserting user profile with role:", userRole);

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        email: data.user.email,
        role: userRole,
        owned_brands: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
        ignoreDuplicates: false,
      }
    );

    if (profileError) {
      console.error("❌ Profile upsert error:", profileError);
      // Don't fail login if profile creation fails
    } else {
      console.log("✅ Profile upserted successfully");
    }

    // Create response with session refresh instruction
    const response = NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
      refreshSession: true, // Signal frontend to refresh session
    });

    // Set additional headers to help with session sync
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    console.log("✅ Login successful, returning response");
    return response;
  } catch (error) {
    console.error("❌ Unexpected login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login" },
      { status: 500 }
    );
  }
}
