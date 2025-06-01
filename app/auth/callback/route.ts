import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  console.log("🔄 Enhanced auth callback route started");

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  console.log("📋 Auth callback parameters:", {
    code: code ? "present" : "missing",
    codeLength: code?.length,
    error,
    state,
    origin,
    next,
    url: request.url,
    userAgent: request.headers.get("user-agent"),
    referer: request.headers.get("referer"),
    timestamp: new Date().toISOString(),
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
    console.log("🔑 Processing OAuth code with enhanced profile handling...");

    try {
      console.log("🏗️ Creating Supabase server client...");

      // Use the server client function that ensures proper PKCE handling
      const { supabase, response } = createClient(request);

      console.log("✅ Supabase client created successfully");
      console.log("🔄 Attempting to exchange code for session...");

      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      console.log("📊 Enhanced exchange result:", {
        hasData: !!data,
        hasSession: !!data?.session,
        hasUser: !!data?.user,
        userEmail: data?.user?.email,
        userMetadata: data?.user?.user_metadata,
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

      if (data?.session && data?.user) {
        console.log("🎉 Code exchange successful:", {
          user: data?.user?.email,
          sessionId: data?.session?.access_token?.substring(0, 10) + "...",
          hasRefreshToken: !!data?.session?.refresh_token,
          userMetadata: data?.user?.user_metadata,
        });

        // Enhanced profile handling for OAuth users
        try {
          console.log("👤 Checking/creating user profile...");

          // Check if profile exists
          const { data: existingProfile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

          if (profileError && profileError.code === "PGRST116") {
            console.log(
              "🆕 Profile not found, creating new profile with OAuth data"
            );

            // Extract user data from OAuth response
            const userData = data.user;
            const userMetadata = userData.user_metadata || {};

            console.log("📊 OAuth user metadata:", userMetadata);

            // Extract name information
            let firstName = "";
            let lastName = "";
            let avatarUrl = "";

            // Handle Google OAuth data
            if (userMetadata.given_name || userMetadata.first_name) {
              firstName =
                userMetadata.given_name || userMetadata.first_name || "";
            }
            if (userMetadata.family_name || userMetadata.last_name) {
              lastName =
                userMetadata.family_name || userMetadata.last_name || "";
            }
            if (userMetadata.avatar_url || userMetadata.picture) {
              avatarUrl = userMetadata.avatar_url || userMetadata.picture || "";
            }

            // Fallback: try to extract name from full_name
            if (!firstName && !lastName && userMetadata.full_name) {
              const nameParts = userMetadata.full_name.split(" ");
              firstName = nameParts[0] || "";
              lastName = nameParts.slice(1).join(" ") || "";
            }

            // Fallback: try to extract name from name field
            if (!firstName && !lastName && userMetadata.name) {
              const nameParts = userMetadata.name.split(" ");
              firstName = nameParts[0] || "";
              lastName = nameParts.slice(1).join(" ") || "";
            }

            const profileData = {
              id: userData.id,
              email: userData.email || "",
              first_name: firstName,
              last_name: lastName,
              avatar_url: avatarUrl,
              role: "user",
              owned_brands: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            console.log("💾 Creating profile with OAuth data:", profileData);

            const { error: createError } = await supabase
              .from("profiles")
              .insert(profileData);

            if (createError && createError.code !== "23505") {
              console.error("❌ Error creating profile:", createError);
            } else {
              console.log("✅ Profile created successfully with OAuth data");
            }
          } else if (existingProfile) {
            console.log("✅ Existing profile found:", {
              id: existingProfile.id,
              email: existingProfile.email,
              firstName: existingProfile.first_name,
              lastName: existingProfile.last_name,
              hasAvatar: !!existingProfile.avatar_url,
            });

            // Update profile with latest OAuth data if missing information
            const userData = data.user;
            const userMetadata = userData.user_metadata || {};

            const updates: any = {};
            let needsUpdate = false;

            // Update missing first name
            if (
              !existingProfile.first_name &&
              (userMetadata.given_name || userMetadata.first_name)
            ) {
              updates.first_name =
                userMetadata.given_name || userMetadata.first_name;
              needsUpdate = true;
            }

            // Update missing last name
            if (
              !existingProfile.last_name &&
              (userMetadata.family_name || userMetadata.last_name)
            ) {
              updates.last_name =
                userMetadata.family_name || userMetadata.last_name;
              needsUpdate = true;
            }

            // Update missing avatar
            if (
              !existingProfile.avatar_url &&
              (userMetadata.avatar_url || userMetadata.picture)
            ) {
              updates.avatar_url =
                userMetadata.avatar_url || userMetadata.picture;
              needsUpdate = true;
            }

            if (needsUpdate) {
              updates.updated_at = new Date().toISOString();
              console.log(
                "🔄 Updating profile with missing OAuth data:",
                updates
              );

              const { error: updateError } = await supabase
                .from("profiles")
                .update(updates)
                .eq("id", userData.id);

              if (updateError) {
                console.error("❌ Error updating profile:", updateError);
              } else {
                console.log("✅ Profile updated with OAuth data");
              }
            }
          }
        } catch (profileErr) {
          console.error("❌ Error handling user profile:", profileErr);
          // Don't fail the auth flow for profile errors
        }

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

        console.log(
          "🎉 Enhanced OAuth callback completed successfully, redirecting..."
        );
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
