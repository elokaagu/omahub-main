import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSafeRedirectPath(input: string | null | undefined): string {
  if (!input) return "/studio";
  if (!input.startsWith("/")) return "/studio";
  if (input.startsWith("//")) return "/studio";
  return input;
}

function toLoginErrorUrl(origin: string, code: string, message: string): string {
  const errorUrl = new URL("/login", origin);
  errorUrl.searchParams.set("error", code);
  errorUrl.searchParams.set("message", message);
  return errorUrl.toString();
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Handle redirect destination - check both 'next' and 'redirect_to' parameters
  const next = getSafeRedirectPath(
    searchParams.get("next") ?? searchParams.get("redirect_to")
  );

  // Handle OAuth errors
  if (error) {
    console.error("OAuth callback returned error:", error);
    return NextResponse.redirect(
      toLoginErrorUrl(origin, "callback_error", "Sign-in failed. Please try again.")
    );
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
        console.error("OAuth session exchange error:", exchangeError.code);
        return NextResponse.redirect(
          toLoginErrorUrl(origin, "session_error", "Unable to complete sign-in.")
        );
      }

      if (data.user) {
        // Check if profile exists, create if not (especially important for OAuth users)
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", data.user.id)
          .single();

        if (profileError && profileError.code === "PGRST116") {
          // Profile doesn't exist, create it
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
            console.error("Profile creation error during OAuth:", insertError.code);
          }
        } else if (profileError) {
          console.error("Profile lookup error during OAuth:", profileError.code);
        }

        // Create redirect URL with session refresh signal
        const redirectUrl = new URL(next, origin);
        redirectUrl.searchParams.set("session_refresh", "true");

        return NextResponse.redirect(redirectUrl.toString());
      }
    } catch (error) {
      console.error(
        "Unexpected OAuth callback error:",
        error instanceof Error ? error.name : "unknown"
      );
      return NextResponse.redirect(
        toLoginErrorUrl(
          origin,
          "unexpected_error",
          "An unexpected error occurred during sign-in."
        )
      );
    }
  }

  // No code provided - redirect to login with error
  return NextResponse.redirect(
    toLoginErrorUrl(origin, "no_code", "Authorization code missing.")
  );
}
