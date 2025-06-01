import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  console.log("🔄 Auth callback route started");

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");

  console.log("📋 Auth callback called with:", {
    code: code ? "present" : "missing",
    error,
    origin,
    next,
    url: request.url,
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

      // Create a response object to handle cookies
      const response = NextResponse.next();

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, {
                  ...options,
                  httpOnly: true,
                  secure: process.env.NODE_ENV === "production",
                  sameSite: "lax",
                  path: "/",
                });
              });
            },
          },
        }
      );

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

        // Create the final redirect response
        const redirectResponse = NextResponse.redirect(redirectUrl);

        // Copy all cookies from the response that was used for the Supabase client
        response.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie.name, cookie.value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
          });
        });

        // Also copy any existing session cookies from the request
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
