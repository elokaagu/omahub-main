"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (!supabase) {
          toast.error("Authentication service unavailable");
          router.push("/auth/signin?error=service_unavailable");
          return;
        }

        // Get the code from URL parameters
        const code = searchParams.get("code");

        if (code) {
          // Exchange the code for a session
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("Auth callback error:", error);
            toast.error("Authentication failed");
            router.push("/auth/signin?error=callback_error");
            return;
          }

          if (data?.user) {
            toast.success("Successfully signed in!");

            // Redirect to intended page or dashboard
            const redirectTo = searchParams.get("redirect_to") || "/studio";
            router.push(redirectTo);
          }
        } else {
          // No code parameter, redirect to sign in
          router.push("/auth/signin");
        }
      } catch (error) {
        console.error("Unexpected auth callback error:", error);
        toast.error("Authentication failed");
        router.push("/auth/signin?error=unexpected_error");
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Completing sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
