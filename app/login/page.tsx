"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, signInWithOAuth } from "@/lib/services/authService";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import ErrorBoundary from "../components/ErrorBoundary";

// Component to handle search params
function LoginForm() {
  const router = useRouter();

  // More defensive approach for search params
  const [urlError, setUrlError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);

  // Enhanced OAuth state management and error checking
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        console.log("🔄 Login page mounted, checking OAuth state...");

        // Clear OAuth progress flag when returning to login using the helper
        import("@/lib/supabase").then(
          ({ clearOAuthProgress, isOAuthInProgress }) => {
            if (isOAuthInProgress()) {
              console.log("⚠️ OAuth was in progress, clearing flag");
            }
            clearOAuthProgress();
          }
        );

        // Check for OAuth errors in session storage
        const oauthError = sessionStorage.getItem("oauth_error");
        if (oauthError) {
          console.log("❌ Found OAuth error in session storage:", oauthError);
          setError(`OAuth Error: ${oauthError}`);
          sessionStorage.removeItem("oauth_error");
        }

        // Check OAuth timing
        const oauthStartTime = sessionStorage.getItem("oauth_start_time");
        if (oauthStartTime) {
          const timeSinceStart = Date.now() - parseInt(oauthStartTime);
          console.log("⏱️ Time since OAuth start:", timeSinceStart, "ms");
          if (timeSinceStart > 60000) {
            // More than 1 minute
            console.log("⚠️ OAuth took too long, clearing flags");
            sessionStorage.removeItem("oauth_start_time");
          }
        }

        // Get error from URL manually instead of using useSearchParams
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get("error");
        if (errorParam) {
          const decodedError = decodeURIComponent(errorParam);
          console.log("❌ URL error parameter:", decodedError);
          setUrlError(decodedError);
          setError(decodedError);

          // Clear the error from URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }

        // Check for successful OAuth completion
        const urlParams2 = new URLSearchParams(window.location.search);
        const successParam = urlParams2.get("oauth_success");
        if (successParam === "true") {
          console.log("✅ OAuth success detected");
          // Clear the success parameter
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      }
    } catch (err) {
      console.error("Error parsing URL parameters:", err);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("📧 Attempting email/password login...");
      const { session } = await signIn(email, password);
      if (session) {
        console.log("✅ Email login successful");
        // Add a small delay to ensure auth state is updated
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Force a hard refresh to ensure auth state is properly updated
        window.location.href = "/";
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "google") => {
    setLoading(true);
    setOauthLoading(true);
    setError(null);

    try {
      console.log(`🚀 Starting ${provider} OAuth flow...`);

      // Check if OAuth is already in progress using the helper
      const { isOAuthInProgress } = await import("@/lib/supabase");
      if (isOAuthInProgress()) {
        console.log("⏳ OAuth already in progress, skipping...");
        setLoading(false);
        setOauthLoading(false);
        return;
      }

      // Clear any previous errors
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("oauth_error");
      }

      console.log("🎯 Initiating OAuth with enhanced debugging...");
      await signInWithOAuth(provider);

      // The redirect will happen automatically
      console.log("🔄 OAuth redirect should have been initiated...");

      // Set a timeout to reset loading state if redirect doesn't happen
      setTimeout(() => {
        console.log("⚠️ OAuth redirect timeout, resetting loading state");
        setLoading(false);
        setOauthLoading(false);
      }, 10000); // 10 seconds timeout
    } catch (err) {
      console.error(`❌ ${provider} sign in error:`, err);
      setError(
        `Failed to sign in with ${
          provider.charAt(0).toUpperCase() + provider.slice(1)
        }. Please try again.`
      );
      setLoading(false);
      setOauthLoading(false);
    }
  };

  return (
    <>
      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-oma-cocoa"
          >
            Email address
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-oma-plum focus:border-oma-plum"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-oma-cocoa"
          >
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-oma-plum focus:border-oma-plum"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-oma-plum focus:ring-oma-plum border-gray-300 rounded"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-oma-cocoa"
            >
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-oma-plum hover:text-oma-plum/80"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            className="w-full bg-oma-plum hover:bg-oma-plum/90"
            disabled={loading}
          >
            {loading && !oauthLoading ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </form>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => handleOAuthSignIn("google")}
          disabled={loading}
          className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-oma-cocoa hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FcGoogle className="h-5 w-5 mr-2" />
          {oauthLoading ? "Connecting to Google..." : "Continue with Google"}
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-oma-cocoa">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-oma-plum hover:text-oma-plum/80"
          >
            Sign up
          </Link>
        </p>
      </div>
    </>
  );
}

// Loading fallback for Suspense
function LoginFormLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse h-10 bg-gray-200 rounded-md"></div>
      <div className="space-y-2">
        <div className="animate-pulse h-5 w-1/4 bg-gray-200 rounded"></div>
        <div className="animate-pulse h-10 bg-gray-200 rounded-md"></div>
      </div>
      <div className="space-y-2">
        <div className="animate-pulse h-5 w-1/4 bg-gray-200 rounded"></div>
        <div className="animate-pulse h-10 bg-gray-200 rounded-md"></div>
      </div>
      <div className="flex justify-between">
        <div className="animate-pulse h-5 w-1/4 bg-gray-200 rounded"></div>
        <div className="animate-pulse h-5 w-1/4 bg-gray-200 rounded"></div>
      </div>
      <div className="animate-pulse h-10 bg-gray-200 rounded-md"></div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-canela text-oma-plum">
          Welcome Back
        </h1>
        <p className="mt-2 text-center text-sm text-oma-cocoa">
          Sign in to your OmaHub account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <ErrorBoundary>
            <Suspense fallback={<LoginFormLoading />}>
              <LoginForm />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
