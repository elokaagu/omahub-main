"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get("code");
        const next = searchParams.get("next") || "/";

        if (!code) {
          throw new Error("No code provided");
        }

        // Exchange the code for a session
        const { data, error: sessionError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (sessionError) {
          throw sessionError;
        }

        // Get the user's profile to check their role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user?.id)
          .single();

        // If trying to access studio, check if user is admin
        if (
          next.startsWith("/studio") &&
          (!profile ||
            (profile.role !== "admin" && profile.role !== "super_admin"))
        ) {
          router.replace("/");
        } else {
          router.replace(next);
        }
      } catch (error) {
        console.error("Error in auth callback:", error);
        router.replace("/login");
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-oma-plum"></div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-oma-plum"></div>
        </div>
      }
    >
      <AuthCallback />
    </Suspense>
  );
}
