"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/lib/services/authService";
import { describeSignUpError } from "@/lib/auth/describeSignUpError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const LOGIN_CONFIRM_MESSAGE =
  "Check your email for a confirmation link before signing in.";

const PASSWORD_MIN = 8;

function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupComplete, setSignupComplete] = useState(false);

  const loginHref = `/login?message=${encodeURIComponent(LOGIN_CONFIRM_MESSAGE)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    if (password.length < PASSWORD_MIN) {
      setError(`Password must be at least ${PASSWORD_MIN} characters long`);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await signUp(trimmedEmail, password);
      setSignupComplete(true);
    } catch (err) {
      console.error("Signup error:", err);
      setError(describeSignUpError(err));
    } finally {
      setLoading(false);
    }
  };

  if (signupComplete) {
    return (
      <div className="space-y-6 text-center">
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <p className="font-medium text-green-900">Account created</p>
          <p className="mt-2 text-green-800">
            We&apos;ve sent a confirmation link to{" "}
            <span className="font-medium">{email.trim()}</span>. Open it to
            verify your email, then sign in.
          </p>
        </div>
        <Button
          asChild
          className="w-full bg-oma-plum hover:bg-oma-plum/90"
        >
          <Link href={loginHref}>Continue to sign in</Link>
        </Button>
        <p className="text-sm text-oma-cocoa">
          Wrong email?{" "}
          <button
            type="button"
            className="font-medium text-oma-plum hover:text-oma-plum/80"
            onClick={() => {
              setSignupComplete(false);
              setPassword("");
              setConfirmPassword("");
              setError(null);
            }}
          >
            Go back and edit
          </button>
        </p>
      </div>
    );
  }

  return (
    <>
      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-gray-300"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn("border-gray-300 pr-10")}
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
          <p className="text-xs text-oma-cocoa">
            At least {PASSWORD_MIN} characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={cn("border-gray-300 pr-10")}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-oma-plum hover:bg-oma-plum/90"
          disabled={loading}
        >
          {loading ? "Creating account…" : "Sign up"}
        </Button>
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

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-gradient-to-b from-oma-beige/50 to-white py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center font-canela text-3xl text-oma-plum">
          Join OmaHub
        </h1>
        <p className="mt-2 text-center text-sm text-oma-cocoa">
          Create your account to discover African fashion
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
