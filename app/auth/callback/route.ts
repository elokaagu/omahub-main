import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  console.log("🔄 OAuth callback received:", {
    hasCode: !!code,
    hasState: !!state,
    error,
    errorDescription,
    origin,
  });

  // Handle OAuth errors
  if (error) {
    console.error("❌ OAuth error:", { error, errorDescription });
    const errorMessage = errorDescription || error;
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}&message=${encodeURIComponent(errorMessage)}`
    );
  }

  if (code) {
    const supabase = createServerSupabaseClient();

    try {
      console.log("🔄 Exchanging code for session");
      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("❌ Code exchange error:", exchangeError);
        return NextResponse.redirect(
          `${origin}/login?error=code_exchange_failed&message=${encodeURIComponent(exchangeError.message)}`
        );
      }

      if (data.session) {
        console.log("✅ Session created successfully:", {
          userId: data.session.user.id,
          email: data.session.user.email,
        });

        // Ensure user profile exists
        await ensureUserProfile(supabase, data.session);

        // Determine redirect destination
        const redirectTo = state ? decodeURIComponent(state) : "/studio";

        console.log("🔄 Redirecting to:", redirectTo);

        // Ensure the redirect URL is safe (starts with /)
        const safeRedirectTo = redirectTo.startsWith("/")
          ? redirectTo
          : "/studio";

        return NextResponse.redirect(`${origin}${safeRedirectTo}`);
      }
    } catch (error) {
      console.error("❌ Unexpected error during code exchange:", error);
      return NextResponse.redirect(
        `${origin}/login?error=unexpected_error&message=${encodeURIComponent("Authentication failed")}`
      );
    }
  }

  // No code provided
  console.error("❌ No authorization code provided");
  return NextResponse.redirect(
    `${origin}/login?error=no_code&message=${encodeURIComponent("No authorization code provided")}`
  );
}

async function ensureUserProfile(supabase: any, session: any) {
  try {
    console.log("🔍 Checking user profile for:", session.user.id);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", session.user.id)
      .single();

    if (profileError && profileError.code === "PGRST116") {
      console.log("🔄 Creating user profile");

      const { error: createError } = await supabase.from("profiles").insert({
        id: session.user.id,
        email: session.user.email,
        role: "user",
        owned_brands: [],
        first_name: session.user.user_metadata?.full_name?.split(" ")[0] || "",
        last_name:
          session.user.user_metadata?.full_name
            ?.split(" ")
            .slice(1)
            .join(" ") || "",
        avatar_url: session.user.user_metadata?.avatar_url || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (createError) {
        console.error("❌ Profile creation failed:", createError);
      } else {
        console.log("✅ Profile created successfully");
      }
    } else if (profile) {
      console.log("✅ Profile already exists");
    } else if (profileError) {
      console.error("❌ Profile check error:", profileError);
    }
  } catch (error) {
    console.error("❌ Profile check/creation error:", error);
  }
}
