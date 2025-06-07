import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  console.log("🔄 OAuth callback triggered");

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  console.log("📋 OAuth callback parameters:", {
    hasCode: !!code,
    hasState: !!state,
    error,
    errorDescription,
    origin,
    fullUrl: request.url,
  });

  // Handle OAuth errors from provider
  if (error) {
    console.error("❌ OAuth provider error:", error, errorDescription);
    const redirectUrl = new URL("/login", origin);
    redirectUrl.searchParams.set("error", error);
    redirectUrl.searchParams.set(
      "message",
      errorDescription || "OAuth authentication failed"
    );
    return NextResponse.redirect(redirectUrl);
  }

  // Check for authorization code
  if (!code) {
    console.error("❌ No authorization code received");
    const redirectUrl = new URL("/login", origin);
    redirectUrl.searchParams.set("error", "no_code");
    redirectUrl.searchParams.set(
      "message",
      "No authorization code received from OAuth provider"
    );
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const cookieStore = cookies();

    // Create Supabase client with enhanced cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name);
            console.log(
              `🍪 Getting cookie ${name}:`,
              cookie ? "found" : "not found"
            );
            return cookie?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              console.log(`🍪 Setting cookie ${name}`);
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              console.error(`❌ Error setting cookie ${name}:`, error);
            }
          },
          remove(name: string, options: any) {
            try {
              console.log(`🍪 Removing cookie ${name}`);
              cookieStore.set({ name, value: "", ...options });
            } catch (error) {
              console.error(`❌ Error removing cookie ${name}:`, error);
            }
          },
        },
      }
    );

    console.log("🔄 Processing OAuth callback...");

    // Use the correct method for OAuth callback handling
    // This handles both the code exchange and PKCE verification automatically
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      console.error("❌ Session retrieval failed:", sessionError);

      // Try to exchange the code manually if session retrieval fails
      console.log("🔄 Attempting manual code exchange...");

      try {
        const { data: exchangeData, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error("❌ Manual code exchange failed:", exchangeError);

          // Handle specific PKCE errors
          if (
            exchangeError.message?.includes("code verifier") ||
            exchangeError.message?.includes("invalid_request")
          ) {
            console.log("🔄 PKCE verification failed, clearing auth state...");

            // Clear any existing auth cookies
            const authCookies = [
              "sb-access-token",
              "sb-refresh-token",
              "supabase-auth-token",
            ];
            authCookies.forEach((cookieName) => {
              try {
                cookieStore.delete(cookieName);
              } catch (e) {
                console.log(`Could not delete cookie ${cookieName}`);
              }
            });

            const redirectUrl = new URL("/login", origin);
            redirectUrl.searchParams.set("error", "pkce_failed");
            redirectUrl.searchParams.set(
              "message",
              "Authentication verification failed. Please try signing in again."
            );
            return NextResponse.redirect(redirectUrl);
          }

          // Handle other exchange errors
          const redirectUrl = new URL("/login", origin);
          redirectUrl.searchParams.set("error", "exchange_failed");
          redirectUrl.searchParams.set(
            "message",
            exchangeError.message || "Failed to complete authentication"
          );
          return NextResponse.redirect(redirectUrl);
        }

        // Use the exchanged session data
        if (exchangeData?.session) {
          console.log("✅ Manual code exchange successful");
          // Continue with the session
        } else {
          console.error("❌ No session from manual exchange");
          const redirectUrl = new URL("/login", origin);
          redirectUrl.searchParams.set("error", "no_session");
          redirectUrl.searchParams.set(
            "message",
            "No session created after authentication"
          );
          return NextResponse.redirect(redirectUrl);
        }
      } catch (manualError) {
        console.error("❌ Manual exchange error:", manualError);
        const redirectUrl = new URL("/login", origin);
        redirectUrl.searchParams.set("error", "callback_error");
        redirectUrl.searchParams.set(
          "message",
          "Authentication callback failed"
        );
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Get the current session (either from initial call or manual exchange)
    const { data: currentSession } = await supabase.auth.getSession();

    if (!currentSession?.session) {
      console.error("❌ No active session found");
      const redirectUrl = new URL("/login", origin);
      redirectUrl.searchParams.set("error", "no_session");
      redirectUrl.searchParams.set("message", "No active session found");
      return NextResponse.redirect(redirectUrl);
    }

    console.log("✅ Session verified successfully:", {
      userId: currentSession.session.user.id,
      email: currentSession.session.user.email,
      provider: currentSession.session.user.app_metadata?.provider,
    });

    // Validate the user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("❌ User validation failed:", userError);
      const redirectUrl = new URL("/login", origin);
      redirectUrl.searchParams.set("error", "user_validation");
      redirectUrl.searchParams.set(
        "message",
        "User validation failed after authentication"
      );
      return NextResponse.redirect(redirectUrl);
    }

    console.log("✅ User validated successfully");

    // Ensure user profile exists
    await ensureUserProfile(supabase, currentSession.session);

    // Determine redirect destination
    const redirectTo = searchParams.get("redirect_to") || "/studio";
    const finalRedirectUrl = new URL(redirectTo, origin);

    console.log("🔄 Redirecting to:", finalRedirectUrl.toString());

    // Add success parameters
    finalRedirectUrl.searchParams.set("auth", "success");

    return NextResponse.redirect(finalRedirectUrl);
  } catch (error) {
    console.error("❌ OAuth callback error:", error);

    const redirectUrl = new URL("/login", origin);
    redirectUrl.searchParams.set("error", "callback_error");
    redirectUrl.searchParams.set(
      "message",
      error instanceof Error ? error.message : "OAuth callback failed"
    );

    return NextResponse.redirect(redirectUrl);
  }
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
