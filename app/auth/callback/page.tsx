"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any[]>([]);

  const addDebugLog = (message: string, data?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
      data: data ? JSON.stringify(data, null, 2) : null,
    };
    console.log(`🔍 [AUTH DEBUG] ${message}`, data);
    setDebugInfo((prev) => [...prev, logEntry]);
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        addDebugLog("Starting simplified auth callback process");

        if (!supabase) {
          addDebugLog("ERROR: Supabase client not available");
          toast.error("Authentication service unavailable");
          router.push("/login?error=service_unavailable");
          return;
        }

        // Log all URL parameters for debugging
        const allParams: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          allParams[key] = value;
        });
        addDebugLog("URL parameters received", allParams);

        // Check for error parameters first
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");
        const errorCode = searchParams.get("error_code");

        if (error) {
          addDebugLog("OAuth error detected", {
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
          router.push(
            `/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || "")}`
          );
          return;
        }

        // Simplified approach: Let Supabase handle the OAuth callback automatically
        addDebugLog("Waiting for Supabase to process OAuth callback...");

        // Set up a single auth state change listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          addDebugLog("Auth state change detected", {
            event,
            hasSession: !!session,
            userId: session?.user?.id,
            email: session?.user?.email,
          });

          if (event === "SIGNED_IN" && session) {
            addDebugLog("User signed in successfully", {
              userId: session.user.id,
              email: session.user.email,
              provider: session.user.app_metadata?.provider,
            });

            // Create profile if it doesn't exist
            try {
              if (!supabase) {
                addDebugLog(
                  "Supabase client not available for profile creation"
                );
                return;
              }

              const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("id")
                .eq("id", session.user.id)
                .single();

              if (profileError && profileError.code === "PGRST116") {
                addDebugLog("Creating user profile");
                const { error: createError } = await supabase
                  .from("profiles")
                  .insert({
                    id: session.user.id,
                    email: session.user.email,
                    role: "user",
                    owned_brands: [],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  });

                if (createError) {
                  addDebugLog("Profile creation failed", createError);
                } else {
                  addDebugLog("Profile created successfully");
                }
              }
            } catch (profileErr) {
              addDebugLog("Profile check/creation error", profileErr);
            }

            toast.success("Successfully signed in!");

            // Clean up subscription
            subscription.unsubscribe();

            // Redirect after a short delay
            const redirectTo = searchParams.get("redirect_to") || "/studio";
            addDebugLog("Redirecting user", { redirectTo });

            setTimeout(() => {
              // Use window.location.href for a full page reload to ensure middleware picks up the session
              window.location.href = redirectTo;
            }, 1000);

            return;
          }

          if (event === "SIGNED_OUT") {
            addDebugLog("User signed out");
            subscription.unsubscribe();
            router.push("/login");
            return;
          }
        });

        // Check if we already have a session
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (currentSession) {
          addDebugLog("Existing session found", {
            userId: currentSession.user.id,
            email: currentSession.user.email,
          });

          toast.success("Successfully signed in!");
          subscription.unsubscribe();

          const redirectTo = searchParams.get("redirect_to") || "/studio";
          setTimeout(() => {
            window.location.href = redirectTo;
          }, 1000);
          return;
        }

        // If no immediate session, wait for the auth state change
        addDebugLog("No immediate session, waiting for auth state change...");

        // Set a timeout to handle cases where auth state change doesn't fire
        setTimeout(() => {
          addDebugLog("Timeout reached, checking session one more time");

          if (!supabase) {
            addDebugLog("Supabase client not available for timeout check");
            router.push("/login?error=service_unavailable");
            setLoading(false);
            return;
          }

          supabase.auth
            .getSession()
            .then(({ data: { session: timeoutSession } }) => {
              if (timeoutSession) {
                addDebugLog("Session found on timeout check", {
                  userId: timeoutSession.user.id,
                });
                toast.success("Successfully signed in!");
                subscription.unsubscribe();

                const redirectTo = searchParams.get("redirect_to") || "/studio";
                window.location.href = redirectTo;
              } else {
                addDebugLog(
                  "No session found after timeout - this indicates an OAuth flow issue"
                );
                subscription.unsubscribe();

                // More specific error message
                const errorDetails =
                  "OAuth callback completed but session was not established. This may be due to redirect URI configuration.";
                router.push(
                  `/login?error=oauth_session_failed&details=${encodeURIComponent(errorDetails)}`
                );
              }
              setLoading(false);
            });
        }, 5000);

        // Clean up subscription after 10 seconds
        setTimeout(() => {
          subscription.unsubscribe();
          if (loading) {
            setLoading(false);
          }
        }, 10000);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const errorStack = error instanceof Error ? error.stack : undefined;

        addDebugLog("Unexpected error in auth callback", {
          error: errorMessage,
          stack: errorStack,
        });

        console.error("Unexpected auth callback error:", error);
        toast.error("Authentication failed");
        router.push(
          `/login?error=unexpected_error&details=${encodeURIComponent(errorMessage)}`
        );
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router, searchParams, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md">
          <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Completing sign in...</p>
          <p className="text-sm text-gray-500">This may take a few seconds</p>

          {/* Debug information in development */}
          {process.env.NODE_ENV === "development" && debugInfo.length > 0 && (
            <div className="mt-8 text-left bg-gray-100 p-4 rounded-lg max-h-64 overflow-y-auto">
              <h3 className="font-semibold mb-2">Debug Log:</h3>
              {debugInfo.map((log, index) => (
                <div key={index} className="text-xs mb-2 border-b pb-1">
                  <div className="font-mono text-gray-500">{log.timestamp}</div>
                  <div className="font-semibold">{log.message}</div>
                  {log.data && (
                    <pre className="text-gray-600 mt-1 whitespace-pre-wrap">
                      {log.data}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
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
