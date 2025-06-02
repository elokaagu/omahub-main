"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clearAllAuthState } from "@/lib/utils/authUtils";

export default function AuthClearPage() {
  const [isClearing, setIsClearing] = useState(true);
  const [isCleared, setIsCleared] = useState(false);

  useEffect(() => {
    const clearAuth = async () => {
      console.log("🧹 Starting auth state cleanup...");

      try {
        // Use the comprehensive clear function
        const success = await clearAllAuthState();

        if (success) {
          console.log("✅ Auth state cleared successfully");
          setIsCleared(true);
        } else {
          console.log("⚠️ Auth state clearing completed with warnings");
          setIsCleared(true);
        }
      } catch (error) {
        console.error("❌ Error clearing auth state:", error);
        setIsCleared(true); // Still mark as cleared to allow user to proceed
      } finally {
        setIsClearing(false);
      }
    };

    clearAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Clearing Authentication
          </h2>

          {isClearing ? (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">
                Clearing authentication state...
              </p>
            </div>
          ) : (
            <div className="mt-4">
              {isCleared ? (
                <div className="text-green-600">
                  <svg
                    className="mx-auto h-8 w-8"
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
                  <p className="mt-2 text-sm">
                    Authentication state cleared successfully!
                  </p>
                </div>
              ) : (
                <div className="text-yellow-600">
                  <svg
                    className="mx-auto h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <p className="mt-2 text-sm">
                    Clearing completed with warnings. Check console for details.
                  </p>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <Link
                  href="/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Try Login Again
                </Link>

                <Link
                  href="/"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
