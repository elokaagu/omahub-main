"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthTest() {
  const {
    user: contextUser,
    session: contextSession,
    loading: contextLoading,
  } = useAuth();
  const [status, setStatus] = useState<{
    session: boolean;
    user: string | null;
    apiTest: string;
    loading: boolean;
  }>({
    session: false,
    user: null,
    apiTest: "Not tested",
    loading: true,
  });

  const supabase = createClientComponentClient();
  const router = useRouter();

  const testAuth = async () => {
    setStatus((prev) => ({ ...prev, loading: true }));

    try {
      // Use the context first since it's working
      const hasContextAuth = !!contextUser && !!contextSession;

      // Also test direct client for comparison
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
      }

      const hasDirectSession = !!session?.user;
      const userEmail = contextUser?.email || session?.user?.email || null;

      // Use context auth as primary, fallback to direct session
      const effectiveAuth = hasContextAuth || hasDirectSession;
      const effectiveUser = contextUser || session?.user;

      console.log("🔍 AuthTest - Auth comparison:", {
        contextAuth: hasContextAuth,
        contextUser: contextUser?.email,
        directSession: hasDirectSession,
        directUser: session?.user?.email,
        effectiveAuth,
        effectiveUser: effectiveUser?.email,
      });

      // Test API call with proper credentials
      let apiResult = "Not tested";
      if (effectiveAuth && effectiveUser) {
        try {
          console.log("🔍 AuthTest - Making API call with credentials...");

          const response = await fetch("/api/admin/leads?action=analytics", {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
            },
          });

          console.log("🔍 AuthTest - API Response:", {
            status: response.status,
            statusText: response.statusText,
          });

          if (response.ok) {
            const data = await response.json();
            console.log("✅ AuthTest - API Success:", data);
            apiResult = "✅ API call successful";
          } else {
            const errorText = await response.text();
            console.error("❌ AuthTest - API Error:", {
              status: response.status,
              statusText: response.statusText,
              error: errorText,
            });
            apiResult = `❌ API failed: ${response.status} ${response.statusText}`;
          }
        } catch (error) {
          console.error("❌ AuthTest - API Exception:", error);
          apiResult = `❌ API error: ${error}`;
        }
      } else {
        apiResult = "❌ No authentication to test API";
      }

      setStatus({
        session: effectiveAuth,
        user: userEmail,
        apiTest: apiResult,
        loading: false,
      });
    } catch (error) {
      console.error("Auth test error:", error);
      setStatus({
        session: false,
        user: null,
        apiTest: `❌ Test error: ${error}`,
        loading: false,
      });
    }
  };

  const fixAuth = async () => {
    try {
      console.log("🔧 Attempting to fix authentication...");

      // Clear any stale data
      localStorage.clear();
      sessionStorage.clear();

      // Refresh the session
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession();

      if (error) {
        console.error("Refresh error:", error);
        // If refresh fails, try to sign out and redirect to login
        await supabase.auth.signOut();
        router.push("/login");
        return;
      }

      if (session) {
        console.log("✅ Session refreshed successfully");
        // Force a page refresh to ensure all components get the new session
        window.location.reload();
      } else {
        console.log("❌ No session after refresh, redirecting to login");
        router.push("/login");
      }
    } catch (error) {
      console.error("Fix auth error:", error);
      // Fallback: redirect to login
      router.push("/login");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  useEffect(() => {
    // Wait for context to load before testing
    if (!contextLoading) {
      testAuth();
    }
  }, [contextLoading, contextUser, contextSession]);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-900">🔍 Auth Test</h3>
        <button
          onClick={testAuth}
          disabled={status.loading || contextLoading}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {status.loading ? "Testing..." : "Retest"}
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">Session:</span>
          <span className={status.session ? "text-green-600" : "text-red-600"}>
            {status.session ? "✅ Active" : "❌ None"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium">User:</span>
          <span className="text-gray-700">
            {status.user || "Not signed in"}
          </span>
        </div>

        <div className="flex items-start gap-2">
          <span className="font-medium">API Test:</span>
          <span
            className={
              status.apiTest.includes("✅")
                ? "text-green-600"
                : status.apiTest.includes("❌")
                  ? "text-red-600"
                  : "text-gray-600"
            }
          >
            {status.apiTest}
          </span>
        </div>

        {/* Context Comparison */}
        <div className="mt-4 pt-4 border-t border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">
            Authentication Sources:
          </h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium">Context User:</span>
              <span className={contextUser ? "text-green-600" : "text-red-600"}>
                {contextUser
                  ? `✅ ${contextUser.email} (${contextUser.role})`
                  : "❌ None"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Context Session:</span>
              <span
                className={contextSession ? "text-green-600" : "text-red-600"}
              >
                {contextSession ? "✅ Present" : "❌ None"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Context Loading:</span>
              <span className="text-gray-600">
                {contextLoading ? "⏳ Loading..." : "✅ Loaded"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {(!status.session || status.apiTest.includes("❌")) &&
        !status.loading &&
        !contextLoading && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            {!status.session ? (
              <>
                <p className="text-sm text-blue-800 mb-3">
                  <strong>Authentication issue detected!</strong> The context
                  shows you're signed in but session detection is failing.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={fixAuth}
                    className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    🔧 Refresh Session
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    🔄 Reload Page
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-blue-800 mb-3">
                  Session is active but API calls are failing. Try refreshing or
                  clearing cache.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={fixAuth}
                    className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    🔧 Fix Authentication
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    🔄 Reload Page
                  </button>
                </div>
              </>
            )}
          </div>
        )}
    </div>
  );
}
