"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/services/authService";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

// Component to handle search params
function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const { user } = await signUp(email, password);
      if (user) {
        router.push(
          "/login?message=Check your email for a confirmation link before signing in."
        );
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm mb-6">
          {message}
        </div>
      )}

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
          <div className="mt-1 relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-oma-plum focus:border-oma-plum"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-oma-cocoa">
            Must be at least 8 characters long
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-oma-cocoa"
          >
            Confirm Password
          </label>
          <div className="mt-1 relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-oma-plum focus:border-oma-plum"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            className="w-full bg-oma-plum hover:bg-oma-plum/90"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Sign up"}
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-oma-cocoa">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-oma-plum hover:text-oma-plum/80"
          >
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}

// Loading fallback for Suspense
function SignupFormLoading() {
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
      <div className="space-y-2">
        <div className="animate-pulse h-5 w-1/4 bg-gray-200 rounded"></div>
        <div className="animate-pulse h-10 bg-gray-200 rounded-md"></div>
      </div>
      <div className="animate-pulse h-10 bg-gray-200 rounded-md"></div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-canela text-oma-plum">
          Join OmaHub
        </h1>
        <p className="mt-2 text-center text-sm text-oma-cocoa">
          Create your account to discover African fashion
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Suspense fallback={<SignupFormLoading />}>
            <SignupForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
