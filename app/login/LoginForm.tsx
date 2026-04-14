"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/services/authService";
import { Button } from "@/components/ui/button";
import {
  saveRememberMe,
  getRememberedData,
  clearRememberMe,
} from "@/lib/utils/rememberMe";
import { Eye, EyeOff } from "lucide-react";
import { deriveLoginUrlState } from "./loginSearchParams";
import { describeSignInFailure } from "./describeSignInFailure";
import { LoginAuthBanners } from "./LoginAuthBanners";

function LoginFormInner() {
  const searchParams = useSearchParams();
  const urlState = useMemo(
    () =>
      deriveLoginUrlState(
        searchParams,
        process.env.NODE_ENV === "development"
      ),
    [searchParams]
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const rememberedData = getRememberedData();
    if (rememberedData.rememberMe && rememberedData.email) {
      setEmail(rememberedData.email);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError(null);

    try {
      const { refreshSession } = await signIn(email, password);

      saveRememberMe(email, rememberMe);

      // Full navigation: new cookies are visible to the server and `AuthContext` can read `session_refresh`.
      if (refreshSession) {
        window.location.assign("/?session_refresh=true");
      } else {
        window.location.assign("/");
      }
    } catch (err) {
      console.error("Login error:", err);
      setSubmitError(describeSignInFailure(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    if (!checked) {
      clearRememberMe();
    }
  };

  return (
    <>
      <div className="space-y-6">
        <LoginAuthBanners
          infoMessage={urlState.infoMessage}
          callbackError={urlState.callbackError}
          submitError={submitError}
          debugJson={urlState.debugJson}
        />

        <form className="space-y-6" onSubmit={handleSubmit}>
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
              className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 shadow-sm placeholder:text-gray-400 focus:border-oma-plum focus:outline-none focus:ring-oma-plum"
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
          <div className="relative mt-1">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm placeholder:text-gray-400 focus:border-oma-plum focus:outline-none focus:ring-oma-plum"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              )}
            </button>
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
              className="h-4 w-4 rounded border-gray-300 text-oma-plum focus:ring-oma-plum"
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
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-oma-cocoa">
          Don&apos;t have an account?{" "}
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

function LoginFormLoading() {
  return (
    <div className="space-y-6">
      <div className="h-10 animate-pulse rounded-md bg-gray-200" />
      <div className="space-y-2">
        <div className="h-5 w-1/4 animate-pulse rounded bg-gray-200" />
        <div className="h-10 animate-pulse rounded-md bg-gray-200" />
      </div>
      <div className="space-y-2">
        <div className="h-5 w-1/4 animate-pulse rounded bg-gray-200" />
        <div className="h-10 animate-pulse rounded-md bg-gray-200" />
      </div>
      <div className="flex justify-between">
        <div className="h-5 w-1/4 animate-pulse rounded bg-gray-200" />
        <div className="h-5 w-1/4 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="h-10 animate-pulse rounded-md bg-gray-200" />
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<LoginFormLoading />}>
      <LoginFormInner />
    </Suspense>
  );
}
