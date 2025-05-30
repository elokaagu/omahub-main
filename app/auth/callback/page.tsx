"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const next = url.searchParams.get("next") || "/";

        if (!code) {
          throw new Error("No code provided");
        }

        // Exchange the code for a session
        const { data, error: sessionError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (sessionError) {
          throw sessionError;
        }

        if (!data.session) {
          throw new Error("No session created");
        }

        // Get the user's profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.session.user.id)
          .single();

        // If no profile exists, create one
        if (profileError && profileError.code === "PGRST116") {
          await supabase.from("profiles").insert({
            id: data.session.user.id,
            email: data.session.user.email,
            role: "user",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        // Redirect to the next URL
        router.push(next);
      } catch (err: any) {
        console.error("Error in auth callback:", err);
        setError(err.message);
        // Redirect to login after a delay
        setTimeout(() => {
          router.push(`/login?error=${encodeURIComponent(err.message)}`);
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-oma-beige/50 to-white">
        <div className="text-center">
          <div className="text-red-500 mb-4 text-xl">Error: {error}</div>
          <p className="text-oma-cocoa">Redirecting you back to login...</p>
        </div>
      </div>
    );
  }

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
