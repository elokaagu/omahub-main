"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface GoogleOAuthButtonProps {
  redirectTo?: string;
  className?: string;
  disabled?: boolean;
}

export default function GoogleOAuthButton({
  redirectTo = "/studio",
  className = "",
  disabled = false,
}: GoogleOAuthButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      toast.error("Authentication service unavailable");
      return;
    }

    try {
      setLoading(true);
      console.log("🚀 Starting Google OAuth flow...");

      // Clear any existing auth state to prevent conflicts
      console.log("🧹 Clearing existing auth state...");
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.warn("⚠️ Sign out warning:", signOutError.message);
      }

      // Clear any existing auth cookies manually
      if (typeof window !== "undefined") {
        // Clear localStorage
        const authKeys = Object.keys(localStorage).filter(
          (key) => key.includes("supabase") || key.includes("auth")
        );
        authKeys.forEach((key) => {
          localStorage.removeItem(key);
          console.log(`🗑️ Cleared localStorage: ${key}`);
        });

        // Clear sessionStorage
        const sessionKeys = Object.keys(sessionStorage).filter(
          (key) => key.includes("supabase") || key.includes("auth")
        );
        sessionKeys.forEach((key) => {
          sessionStorage.removeItem(key);
          console.log(`🗑️ Cleared sessionStorage: ${key}`);
        });
      }

      // Get current origin for redirect URL
      const currentOrigin = window.location.origin;
      const callbackUrl = `${currentOrigin}/auth/callback`;

      console.log("🔗 OAuth Configuration:", {
        provider: "google",
        redirectTo: callbackUrl,
        finalRedirect: redirectTo,
        origin: currentOrigin,
      });

      // Use the OAuth flow with proper PKCE configuration
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          // Ensure PKCE is enabled and browser redirect happens
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error("❌ Google OAuth error:", error);

        // Provide more specific error messages
        let errorMessage = "OAuth failed. Please try again.";

        if (error.message?.includes("Provider not found")) {
          errorMessage =
            "Google OAuth is not configured in Supabase. Please contact support.";
          console.error(
            "💡 Google OAuth provider not found in Supabase configuration"
          );
        } else if (error.message?.includes("Invalid client")) {
          errorMessage = "OAuth configuration error. Please contact support.";
          console.error("💡 Google OAuth client configuration is invalid");
        } else if (error.message?.includes("redirect_uri")) {
          errorMessage =
            "OAuth redirect configuration error. Please contact support.";
          console.error("💡 OAuth redirect URI not configured properly");
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast.error(errorMessage);
        return;
      }

      if (data?.url) {
        console.log("✅ OAuth URL generated successfully");
        console.log("🔄 Redirecting to Google for authentication...");
        console.log("📋 OAuth URL details:", {
          hasState: data.url.includes("state="),
          hasCodeChallenge: data.url.includes("code_challenge="),
          hasRedirectUri: data.url.includes("redirect_uri="),
        });

        // The browser will automatically redirect to Google
        // After user consent, Google redirects back to our callback
        // The callback handler will process the PKCE flow
      } else {
        console.error("❌ No OAuth URL returned from Supabase");
        toast.error("Failed to initiate Google sign-in. Please try again.");
      }
    } catch (error) {
      console.error("❌ Unexpected OAuth error:", error);

      let errorMessage = "An unexpected error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;

        // Handle specific error types
        if (error.message.includes("fetch")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (error.message.includes("CORS")) {
          errorMessage = "Configuration error. Please contact support.";
        }
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={loading || disabled}
      className={`w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      {loading ? (
        <>
          <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full mr-2"></div>
          Connecting to Google...
        </>
      ) : (
        <>
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </>
      )}
    </button>
  );
}
