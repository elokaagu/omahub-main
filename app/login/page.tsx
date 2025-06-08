"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/services/authService";
import { Button } from "@/components/ui/button";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import ErrorBoundary from "../components/ErrorBoundary";
import {
  saveRememberMe,
  getRememberedData,
  clearRememberMe,
} from "@/lib/utils/rememberMe";

// Component to handle search params
function LoginForm() {
  const router = useRouter();

  // More defensive approach for search params
  const [urlError, setUrlError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Load remembered data on component mount
  useEffect(() => {
    const rememberedData = getRememberedData();
    if (rememberedData.rememberMe && rememberedData.email) {
      setEmail(rememberedData.email);
      setRememberMe(true);
    }
  }, []);

  // Check for error parameter in URL
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        // Get error from URL manually instead of using useSearchParams
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get("error");
        const errorDescription = urlParams.get("error_description");
        const details = urlParams.get("details");

        if (errorParam) {
          const decodedError = decodeURIComponent(errorParam);
          setUrlError(decodedError);

          // Create a user-friendly error message
          let friendlyMessage = "Authentication failed. Please try again.";

          if (decodedError === "callback_error") {
            friendlyMessage =
              "There was an issue completing your sign-in. Please try again.";
          } else if (decodedError === "access_denied") {
            friendlyMessage = "Access was denied. Please try signing in again.";
          } else if (decodedError === "service_unavailable") {
            friendlyMessage =
              "Authentication service is temporarily unavailable.";
          } else if (decodedError === "oauth_error") {
            friendlyMessage = "Google sign-in failed. Please try again.";
          } else if (decodedError === "session_error") {
            friendlyMessage =
              "Session creation failed. Please try signing in again.";
          } else if (decodedError === "unexpected_error") {
            friendlyMessage =
              "An unexpected error occurred during sign-in. Please try again.";
          } else if (decodedError === "no_code") {
            friendlyMessage =
              "Authorization failed. Please try signing in again.";
          } else if (errorDescription) {
            friendlyMessage = decodeURIComponent(errorDescription);
          }

          setError(friendlyMessage);

          // Set debug info for development
          if (process.env.NODE_ENV === "development") {
            const debugData = {
              error: decodedError,
              description: errorDescription
                ? decodeURIComponent(errorDescription)
                : null,
              details: details ? decodeURIComponent(details) : null,
              timestamp: new Date().toISOString(),
            };
            setDebugInfo(JSON.stringify(debugData, null, 2));
          }
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
      const { session, refreshSession } = await signIn(email, password);
      if (session) {
        // Save or clear remember me preference
        saveRememberMe(email, rememberMe);

        // Add a small delay to ensure auth state is updated
        await new Promise((resolve) => setTimeout(resolve, 500));

        // If the API indicates we should refresh session (like OAuth), add the parameter
        if (refreshSession) {
          // Redirect with session refresh signal
          window.location.href = "/?session_refresh=true";
        } else {
          // Force a hard refresh to ensure auth state is properly updated
          window.location.href = "/";
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid email or password. Please try again.");

      // Clear remember me data on failed login
      if (rememberMe) {
        clearRememberMe();
        setRememberMe(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    if (!checked) {
      // If unchecking, clear any existing remembered data
      clearRememberMe();
    }
  };

  return (
    <>
      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}

            {/* Debug information in development */}
            {process.env.NODE_ENV === "development" && debugInfo && (
              <details className="mt-3">
                <summary className="cursor-pointer font-semibold">
                  Debug Info (Development Only)
                </summary>
                <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">
                  {debugInfo}
                </pre>
              </details>
            )}
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
              checked={rememberMe}
              onChange={(e) => handleRememberMeChange(e.target.checked)}
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
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-oma-cocoa">
              Or continue with
            </span>
          </div>
        </div>

        <div className="mt-6">
          <GoogleSignInButton className="w-full" redirectTo="/studio" />
        </div>
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
