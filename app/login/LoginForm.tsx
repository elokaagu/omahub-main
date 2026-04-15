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

        <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-oma-black/80"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="block w-full rounded-xl border-0 bg-[#EBF2FA] px-4 py-3.5 text-oma-black shadow-inner ring-1 ring-inset ring-slate-200/70 transition-[box-shadow,background-color] placeholder:text-oma-cocoa/45 focus:bg-white focus:outline-none focus:ring-2 focus:ring-oma-plum/35"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-oma-black/80"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full rounded-xl border-0 bg-[#EBF2FA] px-4 py-3.5 pr-12 text-oma-black shadow-inner ring-1 ring-inset ring-slate-200/70 transition-[box-shadow,background-color] placeholder:text-oma-cocoa/35 focus:bg-white focus:outline-none focus:ring-2 focus:ring-oma-plum/35"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-oma-cocoa/60 transition-colors hover:text-oma-plum"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-[1.125rem] w-[1.125rem]" />
              ) : (
                <Eye className="h-[1.125rem] w-[1.125rem]" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => handleRememberMeChange(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-oma-plum focus:ring-oma-plum/40"
            />
            <label
              htmlFor="remember-me"
              className="text-sm text-oma-cocoa"
            >
              Remember me
            </label>
          </div>

          <Link
            href="/forgot-password"
            className="text-sm font-medium text-oma-plum underline-offset-4 hover:underline sm:text-right"
          >
            Forgot your password?
          </Link>
        </div>

        <div className="pt-1">
          <Button
            type="submit"
            className="h-12 w-full rounded-full bg-oma-plum text-[15px] font-semibold tracking-wide text-white shadow-sm transition-[transform,background-color] hover:bg-oma-plum/92 active:scale-[0.99] disabled:opacity-70"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </div>
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-oma-cocoa/80 sm:text-sm">
        New to OmaHub?{" "}
        <Link
          href="/signup"
          className="font-semibold text-oma-plum underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </>
  );
}

function LoginFormLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200/80" />
        <div className="h-12 animate-pulse rounded-xl bg-[#EBF2FA]" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-20 animate-pulse rounded bg-slate-200/80" />
        <div className="h-12 animate-pulse rounded-xl bg-[#EBF2FA]" />
      </div>
      <div className="flex justify-between pt-1">
        <div className="h-4 w-28 animate-pulse rounded bg-slate-200/80" />
        <div className="h-4 w-36 animate-pulse rounded bg-slate-200/80" />
      </div>
      <div className="h-12 animate-pulse rounded-full bg-oma-plum/25" />
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
