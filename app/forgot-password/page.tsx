"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/lib/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function classifyResetError(err: unknown): "rate_limit" | "connectivity" | "other" {
  const msg =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const lower = msg.toLowerCase();
  if (
    lower.includes("rate") ||
    lower.includes("too many") ||
    lower.includes("429") ||
    lower.includes("over_email_send_rate_limit")
  ) {
    return "rate_limit";
  }
  if (
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("supabase client not available") ||
    lower.includes("load failed")
  ) {
    return "connectivity";
  }
  return "other";
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      toast.error("Please enter your email address.");
      return;
    }
    if (!EMAIL_REGEX.test(normalized)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(normalized);
    } catch (err) {
      console.error("Password reset request:", err);
      const kind = classifyResetError(err);
      if (kind === "rate_limit") {
        toast.error(
          "Too many attempts. Please wait a few minutes and try again."
        );
        return;
      }
      if (kind === "connectivity") {
        toast.error(
          "We couldn’t reach the server. Check your connection and try again."
        );
        return;
      }
      // Do not reveal whether the account exists — same outcome as success
    } finally {
      setLoading(false);
    }

    setEmail(normalized);
    setEmailSent(true);
    toast.success(
      "If an account exists for that address, we’ve sent reset instructions."
    );
  };

  if (emailSent) {
    return (
      <div className="flex min-h-screen flex-col justify-center bg-gradient-to-b from-oma-beige/50 to-white py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Mail className="h-6 w-6 text-green-600" aria-hidden />
            </div>
            <h1 className="mt-6 text-center font-canela text-3xl text-oma-plum">
              Check your email
            </h1>
            <p className="mt-2 text-center text-sm text-oma-cocoa">
              If an account exists for{" "}
              <span className="font-medium">{email}</span>, we&apos;ve sent
              password reset instructions. It may take a minute to arrive.
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-oma-cocoa">
                  Didn&apos;t see anything? Check your spam folder, or{" "}
                  <button
                    type="button"
                    onClick={() => setEmailSent(false)}
                    className="font-medium text-oma-plum hover:text-oma-plum/80"
                  >
                    try again
                  </button>{" "}
                  with the same or another email.
                </p>
              </div>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm font-medium text-oma-plum hover:text-oma-plum/80"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gradient-to-b from-oma-beige/50 to-white py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center font-canela text-3xl text-oma-plum">
          Forgot your password?
        </h1>
        <p className="mt-2 text-center text-sm text-oma-cocoa">
          Enter your email and we&apos;ll send you a link to reset your password
          if an account exists for that address.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-oma-cocoa">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="border-oma-gold/30 focus-visible:ring-oma-plum"
              />
            </div>

            <div>
              <Button
                type="submit"
                className="w-full bg-oma-plum hover:bg-oma-plum/90"
                disabled={loading}
              >
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm font-medium text-oma-plum hover:text-oma-plum/80"
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
