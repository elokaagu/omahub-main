import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  console.log("🔄 OAuth callback triggered");

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  console.log("📋 OAuth callback parameters:", {
    hasCode: !!code,
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

  const cookieStore = cookies();
  const response = NextResponse.redirect(new URL("/auth/success", origin));

  // Create Supabase client with proper cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
            response.cookies.set({ name, value, ...options });
          } catch (error) {
            console.error(`❌ Error setting cookie ${name}:`, error);
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options });
            response.cookies.set({ name, value: "", ...options });
          } catch (error) {
            console.error(`❌ Error removing cookie ${name}:`, error);
          }
        },
      },
    }
  );

  try {
    console.log("🔄 Attempting OAuth callback with code exchange...");

    // First, try the standard exchangeCodeForSession
    let sessionData: any = null;
    let exchangeError: any = null;

    try {
      const result = await supabase.auth.exchangeCodeForSession(code);
      sessionData = result.data;
      exchangeError = result.error;
    } catch (err) {
      console.error("❌ Exchange code error:", err);
      exchangeError = err;
    }

    // If the standard method fails due to PKCE, try alternative approach
    if (
      exchangeError &&
      ((exchangeError.message &&
        exchangeError.message.includes("code verifier")) ||
        (exchangeError.message &&
          exchangeError.message.includes("invalid_request")))
    ) {
      console.log("🔄 PKCE exchange failed, trying alternative approach...");

      try {
        // Use the auth code in a different way - set it in the URL and let Supabase handle it
        const authUrl = new URL(request.url);

        // Try to manually construct the session by calling the Supabase auth endpoint
        const tokenResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=authorization_code`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            },
            body: JSON.stringify({
              auth_code: code,
              code_verifier: "", // Empty code verifier for fallback
            }),
          }
        );

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          console.log("✅ Alternative token exchange successful");

          // Set the session manually
          const { data: setSessionData, error: setSessionError } =
            await supabase.auth.setSession({
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token,
            });

          if (setSessionError) {
            console.error("❌ Set session failed:", setSessionError);
          } else {
            sessionData = setSessionData;
            exchangeError = null;
          }
        } else {
          console.error(
            "❌ Alternative token exchange failed:",
            await tokenResponse.text()
          );
        }
      } catch (altError) {
        console.error("❌ Alternative approach failed:", altError);
      }
    }

    // Handle errors
    if (exchangeError) {
      console.error("❌ All code exchange methods failed:", exchangeError);

      // Handle specific errors
      if (
        exchangeError.message &&
        exchangeError.message.includes("Provider not found")
      ) {
        console.log("🔄 Google OAuth provider not configured");
        const redirectUrl = new URL("/login", origin);
        redirectUrl.searchParams.set("error", "provider_not_configured");
        redirectUrl.searchParams.set(
          "message",
          "Google OAuth is not configured. Please contact support."
        );
        return NextResponse.redirect(redirectUrl);
      }

      if (
        exchangeError.message &&
        (exchangeError.message.includes("code verifier") ||
          exchangeError.message.includes("invalid_request"))
      ) {
        console.log("🔄 PKCE verification failed completely");
        const redirectUrl = new URL("/login", origin);
        redirectUrl.searchParams.set("error", "pkce_failed");
        redirectUrl.searchParams.set(
          "message",
          "Authentication verification failed. Please try again or contact support if the issue persists."
        );
        return NextResponse.redirect(redirectUrl);
      }

      // Generic exchange error
      const redirectUrl = new URL("/login", origin);
      redirectUrl.searchParams.set("error", "exchange_failed");
      redirectUrl.searchParams.set(
        "message",
        exchangeError.message || "Failed to complete authentication"
      );
      return NextResponse.redirect(redirectUrl);
    }

    if (!sessionData?.session) {
      console.error("❌ No session data received");
      const redirectUrl = new URL("/login", origin);
      redirectUrl.searchParams.set("error", "no_session");
      redirectUrl.searchParams.set(
        "message",
        "No session created after authentication"
      );
      return NextResponse.redirect(redirectUrl);
    }

    console.log("✅ Session created successfully:", {
      userId: sessionData.session.user.id,
      email: sessionData.session.user.email,
      provider: sessionData.session.user.app_metadata?.provider,
    });

    // Ensure user profile exists
    await ensureUserProfile(supabase, sessionData.session);

    // Set redirect destination
    const redirectTo = searchParams.get("redirect_to") || "/studio";
    response.headers.set(
      "Location",
      `/auth/success?redirect_to=${encodeURIComponent(redirectTo)}`
    );

    console.log("🔄 Redirecting to success page");

    return response;
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
