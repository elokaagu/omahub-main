"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getRecoveryTokensFromUrl } from "@/lib/auth/resetPasswordRecovery";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";

function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.log(...args);
  }
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  /** Session / link verification only — never used for form validation. */
  const [sessionError, setSessionError] = useState<string | null>(null);
  /** Password rules, mismatch, and updateUser errors — shown on the form only. */
  const [formError, setFormError] = useState<string | null>(null);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  const searchKey = searchParams.toString();

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        setSessionError(null);

        const { accessToken, refreshToken } = getRecoveryTokensFromUrl(searchParams);

        const fromHash =
          typeof window !== "undefined" &&
          window.location.hash.includes("access_token");

        devLog("Reset password tokens:", {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          fromHash,
        });

        if (accessToken && refreshToken) {
          if (!supabase) {
            if (!cancelled) {
              setSessionError(
                "Unable to connect to authentication. Please try again later."
              );
              setIsValidSession(false);
            }
            return;
          }

          devLog("Setting session from URL tokens…");
          const { data, error: setSessionErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (cancelled) return;

          if (setSessionErr) {
            console.error("Error setting recovery session:", setSessionErr);
            setSessionError(
              "Invalid or expired reset link. Please request a new password reset."
            );
            setIsValidSession(false);
            return;
          }

          if (data.session) {
            devLog("Recovery session established");
            if (typeof window !== "undefined" && window.location.hash) {
              window.history.replaceState(
                null,
                "",
                window.location.pathname + window.location.search
              );
            }
            setIsValidSession(true);
            return;
          }
        }

        if (!supabase) {
          if (!cancelled) {
            setSessionError(
              "Unable to connect to authentication. Please try again later."
            );
            setIsValidSession(false);
          }
          return;
        }

        const {
          data: { session },
          error: getSessionErr,
        } = await supabase.auth.getSession();

        if (cancelled) return;

        if (getSessionErr) {
          console.error("Error getting session:", getSessionErr);
          setSessionError(
            "Unable to verify reset session. Please request a new password reset."
          );
          setIsValidSession(false);
          return;
        }

        if (session) {
          devLog("Existing session valid for reset");
          setIsValidSession(true);
        } else {
          setSessionError(
            "Invalid or expired reset link. Please request a new password reset."
          );
          setIsValidSession(false);
        }
      } catch (err) {
        console.error("Session check error:", err);
        if (!cancelled) {
          setSessionError(
            "Unable to verify reset session. Please request a new password reset."
          );
          setIsValidSession(false);
        }
      }
    };

    void checkSession();
    return () => {
      cancelled = true;
    };
  }, [searchKey, searchParams]);

  const validatePassword = (value: string) => {
    if (value.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/(?=.*[a-z])/.test(value)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/(?=.*[A-Z])/.test(value)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/(?=.*\d)/.test(value)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const passwordHint = validatePassword(password);
  const passwordsMatch =
    confirmPassword.length === 0 || password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    const passwordErr = validatePassword(password);
    if (passwordErr) {
      setFormError(passwordErr);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      if (!supabase) {
        throw new Error("Supabase client not available");
      }

      devLog("Updating password…");

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        console.error("Password update error:", updateError);

        let message = "Failed to update password. Please try again.";
        const msg = updateError.message?.toLowerCase() ?? "";

        if (msg.includes("new password should be different")) {
          message =
            "Your new password must be different from your current password. Please choose a different password.";
        } else if (msg.includes("password")) {
          message = updateError.message;
        } else if (msg.includes("session")) {
          message =
            "Your password reset session has expired. Please request a new password reset link.";
        } else if (msg.includes("invalid")) {
          message =
            "Invalid password reset session. Please request a new password reset link.";
        }

        setFormError(message);
        setLoading(false);
        return;
      }

      try {
        await supabase.auth.signOut();
        devLog("Signed out after password reset");
      } catch (signOutError) {
        console.warn("Could not sign out after reset:", signOutError);
      }

      setPasswordReset(true);
      toast.success("Password updated");
    } catch (err: unknown) {
      console.error("Error updating password:", err);

      let message = "Failed to update password. Please try again.";
      const raw =
        err instanceof Error ? err.message?.toLowerCase() ?? "" : "";

      if (raw.includes("new password should be different")) {
        message =
          "Your new password must be different from your current password. Please choose a different password.";
      } else if (raw.includes("session")) {
        message =
          "Your password reset session has expired. Please request a new password reset link.";
      } else if (err instanceof Error && err.message) {
        message = err.message;
      }

      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  if (isValidSession === null) {
    return (
      <div className="flex min-h-screen flex-col justify-center bg-gradient-to-b from-oma-beige/50 to-white py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 rounded-full border-2 border-oma-plum border-t-transparent" />
              <h2 className="mb-2 text-xl font-semibold text-oma-cocoa">
                Verifying reset link…
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

  if (isValidSession === false) {
    return (
      <div className="flex min-h-screen flex-col justify-center bg-gradient-to-b from-oma-beige/50 to-white py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-center font-canela text-3xl text-oma-plum">
            Invalid reset link
          </h1>
          <p className="mt-2 text-center text-sm text-oma-cocoa">
            This link is invalid or has expired.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-4 text-center">
              {sessionError && (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {sessionError}
                </p>
              )}
              <p className="text-sm text-oma-cocoa">
                Request a new link, then open it from your email.
              </p>
              <div className="space-y-3">
                <Link href="/forgot-password">
                  <Button className="w-full bg-oma-plum hover:bg-oma-plum/90">
                    Request new reset link
                  </Button>
                </Link>
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center text-sm font-medium text-oma-plum hover:text-oma-plum/80"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
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
      <div className="flex min-h-screen flex-col justify-center bg-gradient-to-b from-oma-beige/50 to-white py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="mt-6 text-center font-canela text-3xl text-oma-plum">
              Password updated
            </h1>
            <p className="mt-2 text-center text-sm text-oma-cocoa">
              Sign in with your new password.
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
            <Link href="/login">
              <Button className="w-full bg-oma-plum hover:bg-oma-plum/90">
                Go to sign in
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gradient-to-b from-oma-beige/50 to-white py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center font-canela text-3xl text-oma-plum">
          Reset your password
        </h1>
        <p className="mt-2 text-center text-sm text-oma-cocoa">
          Enter your new password below.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {formError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-oma-cocoa"
              >
                New password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFormError(null);
                  }}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm placeholder:text-gray-400 focus:border-oma-plum focus:outline-none focus:ring-oma-plum"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-oma-cocoa">
                At least 8 characters with uppercase, lowercase, and a number.
              </p>
              {password.length > 0 && passwordHint && (
                <p className="mt-1 text-xs text-amber-800">{passwordHint}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-oma-cocoa"
              >
                Confirm new password
              </label>
              <div className="relative mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setFormError(null);
                  }}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm placeholder:text-gray-400 focus:border-oma-plum focus:outline-none focus:ring-oma-plum"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="mt-1 text-xs text-red-600">
                  Passwords do not match
                </p>
              )}
            </div>

            <div>
              <Button
                type="submit"
                className="w-full bg-oma-plum hover:bg-oma-plum/90"
                disabled={loading}
              >
                {loading ? "Updating…" : "Update password"}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm font-medium text-oma-plum hover:text-oma-plum/80"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
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
    <div className="flex min-h-screen flex-col justify-center bg-gradient-to-b from-oma-beige/50 to-white py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="animate-pulse space-y-4">
          <div className="mx-auto h-8 w-3/4 rounded bg-gray-200" />
          <div className="mx-auto h-4 w-1/2 rounded bg-gray-200" />
        </div>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <div className="animate-pulse space-y-6">
            <div className="space-y-2">
              <div className="h-4 w-1/4 rounded bg-gray-200" />
              <div className="h-10 rounded bg-gray-200" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-1/3 rounded bg-gray-200" />
              <div className="h-10 rounded bg-gray-200" />
            </div>
            <div className="h-10 rounded bg-gray-200" />
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
