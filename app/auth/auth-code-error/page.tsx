"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthCodeErrorPage() {
  const searchParams = useSearchParams();
  const [errorDetails, setErrorDetails] = useState<{
    error?: string;
    error_description?: string;
    error_code?: string;
  }>({});

  useEffect(() => {
    // Get error details from URL parameters
    const error = searchParams.get("error");
    const error_description = searchParams.get("error_description");
    const error_code = searchParams.get("error_code");

    setErrorDetails({
      error: error || undefined,
      error_description: error_description || undefined,
      error_code: error_code || undefined,
    });

    // Log error details for debugging
    console.error("🚨 OAuth Error Details:", {
      error,
      error_description,
      error_code,
      url: window.location.href,
    });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-canela text-oma-plum">
              Authentication Error
            </h1>
            <p className="mt-2 text-sm text-oma-cocoa">
              There was a problem signing you in with Google.
            </p>
          </div>

          <div className="mt-6">
            {errorDetails.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-red-800">
                  Error Details:
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    <strong>Error:</strong> {errorDetails.error}
                  </p>
                  {errorDetails.error_description && (
                    <p>
                      <strong>Description:</strong>{" "}
                      {errorDetails.error_description}
                    </p>
                  )}
                  {errorDetails.error_code && (
                    <p>
                      <strong>Code:</strong> {errorDetails.error_code}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800">
                Common Solutions:
              </h3>
              <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
                <li>
                  Make sure Google OAuth is properly configured in Supabase
                </li>
                <li>
                  Check that redirect URLs are correctly set in Google Cloud
                  Console
                </li>
                <li>
                  Verify that the Google OAuth client ID and secret are correct
                </li>
                <li>Ensure the OAuth consent screen is properly configured</li>
              </ul>
            </div>

            <div className="mt-6 flex flex-col space-y-3">
              <Button
                asChild
                className="w-full bg-oma-plum hover:bg-oma-plum/90"
              >
                <Link href="/login">Try Again</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
