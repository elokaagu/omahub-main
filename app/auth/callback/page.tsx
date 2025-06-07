"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addDebugLog = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
    setDebugLogs((prev) => [
      ...prev,
      logMessage + (data ? ` ${JSON.stringify(data)}` : ""),
    ]);
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        addDebugLog("🔄 Starting OAuth callback process");

        if (!supabase) {
          addDebugLog("❌ Supabase client not available");
          toast.error("Authentication service unavailable");
          router.push("/login?error=service_unavailable");
          return;
        }

        // Check for OAuth errors in URL
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");
        const errorCode = searchParams.get("error_code");

        if (error) {
          addDebugLog("❌ OAuth error detected", {
            error,
            errorDescription,
            errorCode,
          });

          let errorMessage = "Authentication failed";
          if (error === "access_denied") {
            errorMessage = "Access was denied. Please try again.";
          } else if (errorDescription) {
            errorMessage = decodeURIComponent(errorDescription);
          }

          toast.error(errorMessage);
          router.push(`/login?error=${encodeURIComponent(error)}`);
          return;
        }

        addDebugLog("🔍 Checking for existing session");

        // Check if we already have a session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          addDebugLog("❌ Session check error", sessionError);
          toast.error("Failed to verify authentication");
          router.push("/login?error=session_check_failed");
          return;
        }

        if (session) {
          addDebugLog("✅ Session found", {
            userId: session.user.id,
            email: session.user.email,
            provider: session.user.app_metadata?.provider,
          });

          // Ensure user profile exists
          await ensureUserProfile(session);

          toast.success("Successfully signed in!");

          const redirectTo = searchParams.get("redirect_to") || "/studio";
          addDebugLog("🔄 Redirecting to", { redirectTo });

          // Use window.location.href for a full page reload to ensure auth state is properly updated
          window.location.href = redirectTo;
          return;
        }

        addDebugLog("⚠️ No session found, waiting for auth state change");

        // Set up auth state listener for OAuth callback
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          addDebugLog("🔄 Auth state change", { event, hasSession: !!session });

          if (event === "SIGNED_IN" && session) {
            addDebugLog("✅ User signed in successfully", {
              userId: session.user.id,
              email: session.user.email,
            });

            // Ensure user profile exists
            await ensureUserProfile(session);

            toast.success("Successfully signed in!");
            subscription.unsubscribe();

            const redirectTo = searchParams.get("redirect_to") || "/studio";
            addDebugLog("🔄 Redirecting to", { redirectTo });

            // Use window.location.href for a full page reload
            window.location.href = redirectTo;
          } else if (event === "SIGNED_OUT") {
            addDebugLog("❌ User signed out during callback");
            subscription.unsubscribe();
            router.push("/login?error=signed_out_during_callback");
          }
        });

        // Set a timeout to handle cases where auth state change doesn't fire
        setTimeout(() => {
          addDebugLog("⏰ Timeout reached, checking session one more time");

          if (!supabase) {
            addDebugLog("❌ Supabase client not available for timeout check");
            router.push("/login?error=service_unavailable");
            setLoading(false);
            return;
          }

          supabase.auth
            .getSession()
            .then(({ data: { session: timeoutSession } }) => {
              if (timeoutSession) {
                addDebugLog("✅ Session found on timeout check");
                toast.success("Successfully signed in!");
                subscription.unsubscribe();

                const redirectTo = searchParams.get("redirect_to") || "/studio";
                window.location.href = redirectTo;
              } else {
                addDebugLog(
                  "❌ No session found after timeout - OAuth flow failed"
                );
                subscription.unsubscribe();

                toast.error("Authentication failed. Please try again.");
                router.push("/login?error=oauth_timeout");
              }
              setLoading(false);
            });
        }, 10000); // 10 second timeout

        // Clean up subscription after 15 seconds
        setTimeout(() => {
          subscription.unsubscribe();
          if (loading) {
            setLoading(false);
          }
        }, 15000);
      } catch (error) {
        addDebugLog("❌ Callback error", error);
        console.error("Auth callback error:", error);
        toast.error("Authentication failed. Please try again.");
        router.push("/login?error=callback_error");
        setLoading(false);
      }
    };

    const ensureUserProfile = async (session: any) => {
      try {
        addDebugLog("🔍 Checking user profile");

        if (!supabase) {
          addDebugLog(
            "❌ Supabase client not available for profile operations"
          );
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", session.user.id)
          .single();

        if (profileError && profileError.code === "PGRST116") {
          addDebugLog("🔄 Creating user profile");

          const { error: createError } = await supabase
            .from("profiles")
            .insert({
              id: session.user.id,
              email: session.user.email,
              role: "user",
              owned_brands: [],
              first_name:
                session.user.user_metadata?.full_name?.split(" ")[0] || "",
              last_name:
                session.user.user_metadata?.full_name
                  ?.split(" ")
                  .slice(1)
                  .join(" ") || "",
              avatar_url: session.user.user_metadata?.avatar_url || "",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (createError) {
            addDebugLog("❌ Profile creation failed", createError);
          } else {
            addDebugLog("✅ Profile created successfully");
          }
        } else if (profile) {
          addDebugLog("✅ Profile already exists");
        }
      } catch (error) {
        addDebugLog("❌ Profile check/creation error", error);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-lg font-canela text-oma-plum mb-2">
              Completing Sign In
            </h2>
            <p className="text-sm text-oma-cocoa">
              Please wait while we complete your authentication...
            </p>
          </div>

          {/* Debug logs for development */}
          {process.env.NODE_ENV === "development" && debugLogs.length > 0 && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Debug Logs (Development Only)
              </h3>
              <div className="text-xs text-gray-600 space-y-1 max-h-40 overflow-y-auto">
                {debugLogs.map((log, index) => (
                  <div key={index} className="font-mono">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
