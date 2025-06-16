"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  // Check if we have a valid session for password reset
  useEffect(() => {
    const checkSession = async () => {
      try {
        // First check URL parameters
        const accessToken = searchParams.get("access_token");
        const refreshToken = searchParams.get("refresh_token");
        const type = searchParams.get("type");

        console.log("🔍 Reset password URL params:", {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          type: type,
        });

        // If we have tokens in URL, set the session
        if (accessToken && refreshToken) {
          console.log("🔑 Setting session from URL tokens...");
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error("❌ Error setting session:", sessionError);
            setError(
              "Invalid or expired reset link. Please request a new password reset."
            );
            setIsValidSession(false);
            return;
          }

          if (data.session) {
            console.log("✅ Session set successfully");
            setIsValidSession(true);
            return;
          }
        }

        // Check if we already have a valid session
        const {
          data: { session },
          error: getSessionError,
        } = await supabase.auth.getSession();

        if (getSessionError) {
          console.error("❌ Error getting session:", getSessionError);
          setError(
            "Unable to verify reset session. Please request a new password reset."
          );
          setIsValidSession(false);
          return;
        }

        if (session) {
          console.log("✅ Valid session found");
          setIsValidSession(true);
        } else {
          console.log("❌ No valid session found");
          setError(
            "Invalid or expired reset link. Please request a new password reset."
          );
          setIsValidSession(false);
        }
      } catch (err) {
        console.error("❌ Session check error:", err);
        setError(
          "Unable to verify reset session. Please request a new password reset."
        );
        setIsValidSession(false);
      }
    };

    checkSession();
  }, [searchParams]);

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/(?=.*\d)/.test(password)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      if (!supabase) {
        throw new Error("Supabase client not available");
      }

      console.log("🔄 Updating password...");

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error("❌ Password update error:", updateError);

        // Provide more specific error messages
        let errorMessage = "Failed to update password. Please try again.";

        if (
          updateError.message
            ?.toLowerCase()
            .includes("new password should be different")
        ) {
          errorMessage =
            "Your new password must be different from your current password. Please choose a different password.";
        } else if (updateError.message?.toLowerCase().includes("password")) {
          errorMessage = updateError.message;
        } else if (updateError.message?.toLowerCase().includes("session")) {
          errorMessage =
            "Your password reset session has expired. Please request a new password reset link.";
        } else if (updateError.message?.toLowerCase().includes("invalid")) {
          errorMessage =
            "Invalid password reset session. Please request a new password reset link.";
        }

        setError(errorMessage);
        setLoading(false);
        return;
      }

      console.log("✅ Password updated successfully");
      setPasswordReset(true);
      toast.success("Password updated successfully!");
    } catch (error: any) {
      console.error("Error updating password:", error);

      // Handle different types of errors
      let errorMessage = "Failed to update password. Please try again.";

      if (
        error.message
          ?.toLowerCase()
          .includes("new password should be different")
      ) {
        errorMessage =
          "Your new password must be different from your current password. Please choose a different password.";
      } else if (error.message?.toLowerCase().includes("session")) {
        errorMessage =
          "Your password reset session has expired. Please request a new password reset link.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-oma-beige/50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-oma-plum border-t-transparent rounded-full mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-oma-cocoa mb-2">
                Verifying Reset Link...
              </h2>
              <p className="text-sm text-gray-600">
                Please wait while we verify your password reset request.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if session is invalid
  if (isValidSession === false || error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-oma-beige/50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-center text-3xl font-canela text-oma-plum">
            Invalid Reset Link
          </h1>
          <p className="mt-2 text-center text-sm text-oma-cocoa">
            This password reset link is invalid or has expired.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center space-y-4">
              <p className="text-sm text-oma-cocoa">
                Please request a new password reset link.
              </p>
              <div className="space-y-3">
                <Link href="/forgot-password">
                  <Button className="w-full bg-oma-plum hover:bg-oma-plum/90">
                    Request New Reset Link
                  </Button>
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center w-full text-sm font-medium text-oma-plum hover:text-oma-plum/80"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (passwordReset) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-oma-beige/50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="mt-6 text-center text-3xl font-canela text-oma-plum">
              Password Updated
            </h1>
            <p className="mt-2 text-center text-sm text-oma-cocoa">
              Your password has been successfully updated.
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <Link href="/login">
                <Button className="w-full bg-oma-plum hover:bg-oma-plum/90">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-canela text-oma-plum">
          Reset your password
        </h1>
        <p className="mt-2 text-center text-sm text-oma-cocoa">
          Enter your new password below.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-oma-cocoa"
              >
                New Password
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
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-oma-cocoa">
                Must be at least 8 characters with uppercase, lowercase, and
                number
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-oma-cocoa"
              >
                Confirm New Password
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
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
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
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm font-medium text-oma-plum hover:text-oma-plum/80"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="animate-pulse space-y-6">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
