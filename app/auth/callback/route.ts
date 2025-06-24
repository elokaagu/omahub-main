import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle redirect destination - check both 'next' and 'redirect_to' parameters
  const next =
    searchParams.get("next") ?? searchParams.get("redirect_to") ?? "/studio";

  console.log("🔄 OAuth callback received:", {
    hasCode: !!code,
    hasError: !!error,
    redirectTo: next,
    error: error,
    errorDescription: errorDescription,
  });

  // Handle OAuth errors
  if (error) {
    console.error("❌ OAuth error:", error, errorDescription);
    const errorUrl = new URL("/login", origin);
    errorUrl.searchParams.set("error", "callback_error");
    errorUrl.searchParams.set("message", errorDescription || error);
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

    try {
      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("❌ Session exchange error:", exchangeError);
        const errorUrl = new URL("/login", origin);
        errorUrl.searchParams.set("error", "session_error");
        errorUrl.searchParams.set("message", exchangeError.message);
        return NextResponse.redirect(errorUrl.toString());
      }

      if (data.user) {
        console.log("✅ OAuth session created for:", data.user.email);

        // Check if profile exists, create if not (especially important for OAuth users)
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profileError && profileError.code === "PGRST116") {
          // Profile doesn't exist, create it
          console.log("🔧 Creating profile for OAuth user:", data.user.email);

          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: data.user.id,
              email: data.user.email,
              role: "user",
              first_name:
                data.user.user_metadata?.full_name?.split(" ")[0] || "",
              last_name:
                data.user.user_metadata?.full_name
                  ?.split(" ")
                  .slice(1)
                  .join(" ") || "",
              avatar_url: data.user.user_metadata?.avatar_url || "",
            });

          if (insertError) {
            console.error("❌ Profile creation error:", insertError);
            // Don't fail the OAuth flow if profile creation fails
            // The user can still be authenticated even without a profile
            console.log(
              "⚠️ Continuing OAuth flow despite profile creation error"
            );
          } else {
            console.log("✅ Profile created successfully");
          }
        } else if (profileError) {
          console.error("❌ Profile check error:", profileError);
          // Log the error but don't fail the OAuth flow
          console.log("⚠️ Continuing OAuth flow despite profile check error");
        } else {
          console.log("✅ Profile already exists for user:", data.user.email);
        }

        // Create redirect URL with session refresh signal
        const redirectUrl = new URL(next, origin);
        redirectUrl.searchParams.set("session_refresh", "true");

        console.log("🔄 Redirecting to:", redirectUrl.toString());
        return NextResponse.redirect(redirectUrl.toString());
      }
    } catch (error) {
      console.error("❌ Unexpected OAuth callback error:", error);
      const errorUrl = new URL("/login", origin);
      errorUrl.searchParams.set("error", "unexpected_error");
      errorUrl.searchParams.set(
        "message",
        "An unexpected error occurred during sign-in"
      );
      return NextResponse.redirect(errorUrl.toString());
    }
  }

  // No code provided - redirect to login with error
  console.error("❌ No authorization code provided");
  const errorUrl = new URL("/login", origin);
  errorUrl.searchParams.set("error", "no_code");
  errorUrl.searchParams.set("message", "Authorization code missing");
  return NextResponse.redirect(errorUrl.toString());
}
