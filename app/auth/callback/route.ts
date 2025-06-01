import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");

  console.log("Auth callback called with:", {
    code: code ? "present" : "missing",
    error,
    origin,
    next,
    url: request.url,
  });

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error from provider:", error);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}`
    );
  }

  if (code) {
    console.log("Processing OAuth code...");

    const supabase = await createClient();

    console.log("Attempting to exchange code for session...");

    try {
      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (!exchangeError && data?.session) {
        console.log("Code exchange successful:", {
          user: data?.user?.email,
          session: data?.session ? "present" : "missing",
        });

        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocalEnv = process.env.NODE_ENV === "development";

        // Create the redirect URL
        const redirectUrl = isLocalEnv
          ? `${origin}${next}`
          : forwardedHost
            ? `https://${forwardedHost}${next}`
            : `${origin}${next}`;

        console.log("Redirecting to:", redirectUrl);

        // Create a new response with redirect
        const response = NextResponse.redirect(redirectUrl);

        // Add a header to indicate successful OAuth
        response.headers.set("x-oauth-success", "true");

        return response;
      } else {
        console.error("Error exchanging code for session:", {
          message: exchangeError?.message,
          status: exchangeError?.status,
          details: exchangeError,
        });
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent("Authentication failed")}`
        );
      }
    } catch (error) {
      console.error("Exception during code exchange:", error);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent("Authentication failed")}`
      );
    }
  }

  console.log("No code provided, redirecting to login");
  // return the user to login with an error message
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Invalid authentication code")}`
  );
}
