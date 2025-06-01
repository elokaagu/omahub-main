import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  console.log("🔄 Auth callback route started");

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");

  console.log("📋 Auth callback called with:", {
    code: code ? "present" : "missing",
    codeLength: code?.length,
    error,
    origin,
    next,
    url: request.url,
    userAgent: request.headers.get("user-agent"),
    referer: request.headers.get("referer"),
  });

  // Log all cookies received
  const allCookies = request.cookies.getAll();
  const supabaseCookies = allCookies.filter((c) => c.name.startsWith("sb-"));
  console.log("🍪 Cookies received in callback:", {
    totalCookies: allCookies.length,
    supabaseCookies: supabaseCookies.length,
    supabaseCookieNames: supabaseCookies.map((c) => c.name),
    supabaseCookieDetails: supabaseCookies.map((c) => ({
      name: c.name,
      valueLength: c.value?.length || 0,
      valuePreview: c.value?.substring(0, 50) + "...",
    })),
  });

  // Handle OAuth errors
  if (error) {
    console.error("❌ OAuth error from provider:", error);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}`
    );
  }

  if (code) {
    console.log("🔑 Processing OAuth code...");

    try {
      console.log("🏗️ Creating Supabase server client...");

      // Use the new server client function that ensures proper PKCE handling
      const { supabase, response } = createClient(request);

      console.log("✅ Supabase client created successfully");
      console.log("🔄 Attempting to exchange code for session...");

      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      console.log("📊 Exchange result:", {
        hasData: !!data,
        hasSession: !!data?.session,
        hasUser: !!data?.user,
        hasError: !!exchangeError,
        errorMessage: exchangeError?.message,
        errorCode: exchangeError?.code,
      });

      if (exchangeError) {
        console.error("❌ Error exchanging code for session:", {
          message: exchangeError?.message,
          status: exchangeError?.status,
          code: exchangeError?.code,
          details: exchangeError,
        });

        // Handle specific error types
        if (exchangeError?.code === "refresh_token_not_found") {
          console.error(
            "🔄 Refresh token not found - this might be expected for new sessions"
          );
          // For refresh token errors, we might still have a valid session
          if (data?.session) {
            console.log(
              "✅ Session exists despite refresh token error, proceeding..."
            );
          } else {
            return NextResponse.redirect(
              `${origin}/login?error=${encodeURIComponent("Authentication failed - please try again")}`
            );
          }
        } else if (exchangeError?.message?.includes("code verifier")) {
          console.error("🔐 PKCE Error: OAuth flow was interrupted");
          console.error("🔍 Debugging info:", {
            hasCode: !!code,
            codeLength: code?.length,
            cookies: request.cookies
              .getAll()
              .filter((c) => c.name.startsWith("sb-")),
            userAgent: request.headers.get("user-agent"),
            referer: request.headers.get("referer"),
          });
          return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent("Authentication failed - please try again")}`
          );
        } else {
          return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent("Authentication failed - please try again")}`
          );
        }
      }

      if (data?.session) {
        console.log("🎉 Code exchange successful:", {
          user: data?.user?.email,
          sessionId: data?.session?.access_token?.substring(0, 10) + "...",
          hasRefreshToken: !!data?.session?.refresh_token,
        });

        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocalEnv = process.env.NODE_ENV === "development";

        // Create the redirect URL
        const redirectUrl = isLocalEnv
          ? `${origin}${next}`
          : forwardedHost
            ? `https://${forwardedHost}${next}`
            : `${origin}${next}`;

        console.log("🚀 Redirecting to:", redirectUrl);

        // Create the final redirect response using the response from server client
        const redirectResponse = NextResponse.redirect(redirectUrl);

        // Copy all cookies from the server client response
        response.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie.name, cookie.value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
          });
        });

        // Also ensure any session cookies from the request are preserved
        request.cookies.getAll().forEach((cookie) => {
          if (cookie.name.startsWith("sb-")) {
            redirectResponse.cookies.set(cookie.name, cookie.value, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
              maxAge: 60 * 60 * 24 * 7, // 7 days
            });
          }
        });

        // Add headers to indicate successful OAuth
        redirectResponse.headers.set("x-oauth-success", "true");
        redirectResponse.headers.set("x-clear-oauth-progress", "true");

        console.log("🎉 OAuth callback completed successfully, redirecting...");
        return redirectResponse;
      } else {
        console.error("❌ No session data received");
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent("Authentication failed - no session created")}`
        );
      }
    } catch (error) {
      console.error("💥 Exception during code exchange:", error);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent("Authentication failed")}`
      );
    }
  }

  console.log("⚠️ No code provided, redirecting to login");
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Invalid authentication code")}`
  );
}
