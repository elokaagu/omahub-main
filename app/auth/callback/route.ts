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
