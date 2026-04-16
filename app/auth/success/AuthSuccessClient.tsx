"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function getSafeRedirectPath(input: string | null): string {
  if (!input) return "/studio";
  if (!input.startsWith("/")) return "/studio";
  if (input.startsWith("//")) return "/studio";
  return input;
}

export function AuthSuccessLoading() {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-gradient-to-b from-oma-beige/50 to-white py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-oma-plum border-t-transparent" />
            <h2 className="mb-2 text-xl font-semibold text-oma-cocoa">
              Completing Authentication...
            </h2>
            <p className="text-sm text-gray-600">
              Please wait while we verify your authentication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isCancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleAuthSuccess = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session check failed:", error.message);
          if (isCancelled) return;
          setStatus("error");
          setMessage("We couldn't verify your sign-in session.");
          return;
        }

        if (session) {
          if (isCancelled) return;
          setStatus("success");
          setMessage("Sign-in successful.");

          timeoutId = setTimeout(() => {
            const redirectTo = getSafeRedirectPath(
              searchParams.get("redirect_to")
            );
            router.push(redirectTo);
          }, 2000);
        } else {
          console.error("No active session found after auth callback");
          if (isCancelled) return;
          setStatus("error");
          setMessage("No active session was found.");

          timeoutId = setTimeout(() => {
            router.push(
              "/login?error=no_session&message=Please sign in again."
            );
          }, 3000);
        }
      } catch (error) {
        console.error(
          "Auth success check failed:",
          error instanceof Error ? error.message : "unknown"
        );
        if (isCancelled) return;
        setStatus("error");
        setMessage("We couldn't complete sign-in.");

        timeoutId = setTimeout(() => {
          router.push(
            "/login?error=auth_check_failed&message=Please try signing in again."
          );
        }, 3000);
      }
    };

    handleAuthSuccess();

    return () => {
      isCancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gradient-to-b from-oma-beige/50 to-white py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {status === "loading" && (
              <>
                <div className="mx-auto mb-4 h-8 w-8 rounded-full border-2 border-oma-plum border-t-transparent" />
                <h2 className="mb-2 text-xl font-semibold text-oma-cocoa">
                  Completing Authentication...
                </h2>
                <p className="text-sm text-gray-600">
                  Please wait while we verify your authentication.
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="mx-auto mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="mb-2 text-xl font-semibold text-green-800">
                  Authentication Successful!
                </h2>
                <p className="mb-4 text-sm text-gray-600">{message}</p>
                <p className="text-xs text-gray-500">
                  Redirecting you to your dashboard...
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <div className="mx-auto mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                  <svg
                    className="h-5 w-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h2 className="mb-2 text-xl font-semibold text-red-800">
                  Authentication Failed
                </h2>
                <p className="mb-4 text-sm text-gray-600">{message}</p>
                <p className="text-xs text-gray-500">
                  Redirecting you back to login...
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
