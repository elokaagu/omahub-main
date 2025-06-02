"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { toast } from "sonner";

export default function SignInPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Handle error messages from URL params
    const error = searchParams.get("error");
    if (error) {
      switch (error) {
        case "callback_error":
          toast.error("Authentication failed. Please try again.");
          break;
        case "service_unavailable":
          toast.error("Authentication service is currently unavailable.");
          break;
        case "unexpected_error":
          toast.error("An unexpected error occurred. Please try again.");
          break;
        default:
          toast.error("An error occurred during sign in.");
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-canela text-gray-900 mb-2">
            Welcome to OmaHub
          </h1>
          <p className="text-gray-600">
            Sign in to access your studio dashboard
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Choose your preferred sign-in method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <GoogleSignInButton
              className="w-full"
              redirectTo={`${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent("/studio")}`}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* You can add email/password form here if needed */}
            <div className="text-center text-sm text-gray-500">
              Email sign-in coming soon
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          By signing in, you agree to our{" "}
          <a href="/terms" className="text-oma-plum hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-oma-plum hover:underline">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}
