import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/";

  console.log("🔄 Auth callback received:", {
    hasCode: !!code,
    error,
    error_description,
    origin,
    next,
  });

  // If there's an error from OAuth provider, redirect to error page with details
  if (error) {
    console.error("❌ OAuth provider error:", { error, error_description });
    const errorUrl = new URL("/auth/auth-code-error", origin);
    errorUrl.searchParams.set("error", error);
    if (error_description) {
      errorUrl.searchParams.set("error_description", error_description);
    }
    return NextResponse.redirect(errorUrl.toString());
  }

  if (code) {
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

    console.log("🔑 Exchanging code for session...");
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError && data.session) {
      console.log("✅ Session exchange successful:", {
        userId: data.session.user.id,
        email: data.session.user.email,
      });

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } else {
      console.error("❌ Session exchange failed:", exchangeError);
      const errorUrl = new URL("/auth/auth-code-error", origin);
      errorUrl.searchParams.set("error", "session_exchange_failed");
      errorUrl.searchParams.set(
        "error_description",
        exchangeError?.message || "Failed to exchange code for session"
      );
      return NextResponse.redirect(errorUrl.toString());
    }
  }

  // No code and no error - something went wrong
  console.error("❌ No code or error in callback");
  const errorUrl = new URL("/auth/auth-code-error", origin);
  errorUrl.searchParams.set("error", "missing_code");
  errorUrl.searchParams.set(
    "error_description",
    "No authorization code received from OAuth provider"
  );
  return NextResponse.redirect(errorUrl.toString());
}
