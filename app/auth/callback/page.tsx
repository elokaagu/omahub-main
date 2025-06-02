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
        addDebugLog("Starting auth callback process");

        if (!supabase) {
          addDebugLog("ERROR: Supabase client not available");
          toast.error("Authentication service unavailable");
          router.push("/login?error=service_unavailable");
          return;
        }

        addDebugLog("Supabase client available");

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

        // Enhanced session handling with multiple attempts
        let sessionEstablished = false;
        let attempts = 0;
        const maxAttempts = 3;

        const checkAndEstablishSession = async (): Promise<boolean> => {
          attempts++;
          addDebugLog(`Session check attempt ${attempts}/${maxAttempts}`);

          try {
            // Ensure supabase client is available
            if (!supabase) {
              addDebugLog("Supabase client not available for session check");
              return false;
            }

            // First, try to get the current session
            const {
              data: { session: currentSession },
              error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError) {
              addDebugLog("Session error", sessionError);
              return false;
            }

            if (currentSession) {
              addDebugLog("Session found", {
                userId: currentSession.user.id,
                email: currentSession.user.email,
                expiresAt: currentSession.expires_at,
                provider: currentSession.user.app_metadata?.provider,
              });

              // Test if we can make an authenticated request
              const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("id, email, role")
                .eq("id", currentSession.user.id)
                .single();

              if (profileError && profileError.code === "PGRST116") {
                // Profile doesn't exist, create it
                addDebugLog("Creating user profile");
                const { error: createError } = await supabase
                  .from("profiles")
                  .insert({
                    id: currentSession.user.id,
                    email: currentSession.user.email,
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
              } else if (profile) {
                addDebugLog("User profile found", profile);
              }

              return true;
            } else {
              addDebugLog("No session found");
              return false;
            }
          } catch (error) {
            addDebugLog("Session check error", error);
            return false;
          }
        };

        // Set up auth state change listener
        addDebugLog("Setting up auth state change listener");

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          addDebugLog("Auth state change detected", {
            event,
            hasSession: !!session,
            userId: session?.user?.id,
          });

          if (event === "SIGNED_IN" && session && !sessionEstablished) {
            sessionEstablished = true;
            addDebugLog("User signed in via state change", {
              userId: session.user.id,
              email: session.user.email,
              provider: session.user.app_metadata?.provider,
            });

            toast.success("Successfully signed in!");

            // Wait a moment for session to propagate
            setTimeout(async () => {
              const redirectTo = searchParams.get("redirect_to") || "/studio";
              addDebugLog("Redirecting user after state change", {
                redirectTo,
              });

              // Clean up subscription
              subscription.unsubscribe();

              // Force a page reload to ensure middleware picks up the session
              window.location.href = redirectTo;
            }, 1500);
          } else if (event === "SIGNED_OUT") {
            addDebugLog("User signed out");
            subscription.unsubscribe();
            router.push("/login");
          }
        });

        // Try to establish session immediately
        const hasSession = await checkAndEstablishSession();

        if (hasSession && !sessionEstablished) {
          sessionEstablished = true;
          addDebugLog("Session established immediately");
          toast.success("Successfully signed in!");

          const redirectTo = searchParams.get("redirect_to") || "/studio";
          subscription.unsubscribe();

          // Force a page reload to ensure middleware picks up the session
          setTimeout(() => {
            addDebugLog("Redirecting user immediately", { redirectTo });
            window.location.href = redirectTo;
          }, 1000);
        } else if (!hasSession) {
          addDebugLog("No immediate session, waiting for auth state change");

          // Set progressive timeouts to retry session establishment
          const retryIntervals = [2000, 5000, 8000];

          retryIntervals.forEach((interval, index) => {
            setTimeout(async () => {
              if (!sessionEstablished && attempts < maxAttempts) {
                addDebugLog(`Retry timeout ${index + 1} reached`);
                const retrySuccess = await checkAndEstablishSession();

                if (retrySuccess && !sessionEstablished) {
                  sessionEstablished = true;
                  addDebugLog("Session established on retry");
                  toast.success("Successfully signed in!");

                  const redirectTo =
                    searchParams.get("redirect_to") || "/studio";
                  subscription.unsubscribe();
                  window.location.href = redirectTo;
                }
              }
            }, interval);
          });

          // Final timeout - if nothing works, redirect to login with error
          setTimeout(() => {
            if (!sessionEstablished) {
              addDebugLog("All attempts failed, redirecting to login");
              subscription.unsubscribe();
              router.push(
                "/login?error=session_timeout&details=Could not establish authentication session"
              );
              setLoading(false);
            }
          }, 10000);
        }

        // Clean up subscription after 15 seconds regardless
        setTimeout(() => {
          subscription.unsubscribe();
          if (loading && !sessionEstablished) {
            setLoading(false);
          }
        }, 15000);
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
