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

    // Create response first to handle cookies properly
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    try {
      console.log("🏗️ Creating Supabase server client...");

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
                request.cookies.set(name, value);
                response.cookies.set(name, value, options);
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

      if (!exchangeError && data?.session) {
        console.log("🎉 Code exchange successful:", {
          user: data?.user?.email,
          sessionId: data?.session?.access_token?.substring(0, 10) + "...",
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

        // Create a new response with redirect and preserve cookies
        response = NextResponse.redirect(redirectUrl);

        // Copy over any cookies that were set during the session exchange
        const sessionCookies = request.cookies.getAll();
        sessionCookies.forEach((cookie) => {
          if (cookie.name.startsWith("sb-")) {
            response.cookies.set(cookie.name, cookie.value, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
            });
          }
        });

        // Add a header to indicate successful OAuth and clear progress flag
        response.headers.set("x-oauth-success", "true");
        response.headers.set("x-clear-oauth-progress", "true");

        return response;
      } else {
        console.error("❌ Error exchanging code for session:", {
          message: exchangeError?.message,
          status: exchangeError?.status,
          code: exchangeError?.code,
          details: exchangeError,
        });

        // If it's a PKCE error, try to provide more helpful feedback
        if (exchangeError?.message?.includes("code verifier")) {
          console.error(
            "🔐 PKCE Error: This usually means the OAuth flow was interrupted or cookies were cleared"
          );
          console.error("🔍 Debugging info:", {
            hasCode: !!code,
            codeLength: code?.length,
            cookies: request.cookies
              .getAll()
              .filter((c) => c.name.startsWith("sb-")),
            userAgent: request.headers.get("user-agent"),
            referer: request.headers.get("referer"),
          });
        }

        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent("Authentication failed - please try again")}`
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
  // return the user to login with an error message
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Invalid authentication code")}`
  );
}
