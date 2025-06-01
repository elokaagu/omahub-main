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

  // Check for error parameter in URL and clear OAuth flag
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        // Clear OAuth progress flag when returning to login using the helper
        import("@/lib/supabase").then(({ clearOAuthProgress }) => {
          clearOAuthProgress();
        });

        // Get error from URL manually instead of using useSearchParams
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get("error");
        if (errorParam) {
          setUrlError(decodeURIComponent(errorParam));
          setError(decodeURIComponent(errorParam));
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
      const { session } = await signIn(email, password);
      if (session) {
        // Add a small delay to ensure auth state is updated
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Force a hard refresh to ensure auth state is properly updated
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "google") => {
    setLoading(true);
    setError(null);

    try {
      // Check if OAuth is already in progress using the helper
      const { isOAuthInProgress } = await import("@/lib/supabase");
      if (isOAuthInProgress()) {
        console.log("OAuth already in progress");
        setLoading(false);
        return;
      }

      await signInWithOAuth(provider);
      // The redirect will happen automatically
    } catch (err) {
      console.error(`${provider} sign in error:`, err);
      setError(
        `Failed to sign in with ${
          provider.charAt(0).toUpperCase() + provider.slice(1)
        }. Please try again.`
      );
      setLoading(false);
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
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </form>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => handleOAuthSignIn("google")}
          disabled={loading}
          className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-oma-cocoa hover:bg-gray-50"
        >
          <FcGoogle className="h-5 w-5 mr-2" />
          Continue with Google
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
