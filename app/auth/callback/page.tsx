"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      try {
        // Get the code and next URL from the query parameters
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const next = url.searchParams.get("next") || "/";

        if (code) {
          // Exchange the code for a session
          const { error: sessionError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (sessionError) {
            console.error("Error exchanging code for session:", sessionError);
            setError(sessionError.message);
            setTimeout(() => {
              router.push("/login?error=Authentication%20failed");
            }, 2000);
            return;
          }

          // Redirect to the home page or the next URL
          router.push(next);
        } else {
          // No code found, redirect to login
          setError("No authentication code found");
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        }
      } catch (error: any) {
        console.error("Error in auth callback:", error);
        setError(error.message || "Unknown authentication error");
        setTimeout(() => {
          router.push("/login?error=Authentication%20failed");
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-oma-beige/50 to-white">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-red-500 mb-4 text-xl">Error: {error}</div>
            <p className="text-oma-cocoa">Redirecting you back to login...</p>
          </>
        ) : (
          <>
            <div className="animate-spin h-12 w-12 border-4 border-oma-plum border-t-transparent rounded-full mx-auto mb-4"></div>
            <h1 className="text-2xl font-canela text-oma-plum">
              Completing sign in...
            </h1>
            <p className="text-oma-cocoa mt-2">
              Please wait while we complete your authentication.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
