"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

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
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("Error exchanging code for session:", error);
            router.push("/login?error=Authentication%20failed");
            return;
          }

          // Redirect to the home page or the next URL
          router.push(next);
        } else {
          // No code found, redirect to login
          router.push("/login");
        }
      } catch (error) {
        console.error("Error in auth callback:", error);
        router.push("/login?error=Authentication%20failed");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-oma-beige/50 to-white">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-4 border-oma-plum border-t-transparent rounded-full mx-auto mb-4"></div>
        <h1 className="text-2xl font-canela text-oma-plum">
          Completing sign in...
        </h1>
        <p className="text-oma-cocoa mt-2">
          Please wait while we complete your authentication.
        </p>
      </div>
    </div>
  );
}
