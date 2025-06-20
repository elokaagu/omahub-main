"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export default function AuthTest() {
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
      // Test session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        setStatus({
          session: false,
          user: null,
          apiTest: "Session error: " + sessionError.message,
          loading: false,
        });
        return;
      }

      const hasSession = !!session?.user;
      const userEmail = session?.user?.email || null;

      // Test API call with proper credentials
      let apiResult = "Not tested";
      if (hasSession) {
        try {
          const response = await fetch("/api/admin/leads?action=analytics", {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            apiResult = "✅ API call successful";
          } else {
            const errorText = await response.text();
            apiResult = `❌ API failed: ${response.status} ${response.statusText} - ${errorText}`;
          }
        } catch (error) {
          apiResult = `❌ API error: ${error}`;
        }
      } else {
        apiResult = "❌ No session to test API";
      }

      setStatus({
        session: hasSession,
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
    testAuth();
  }, []);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-900">🔍 Auth Test</h3>
        <button
          onClick={testAuth}
          disabled={status.loading}
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
      </div>

      {(!status.session || status.apiTest.includes("❌")) &&
        !status.loading && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            {!status.session ? (
              <>
                <p className="text-sm text-blue-800 mb-3">
                  <strong>You need to sign in first!</strong> You're not
                  currently authenticated.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push("/login")}
                    className="px-4 py-2 bg-oma-plum text-white rounded text-sm hover:bg-oma-plum/90 font-medium"
                  >
                    🔐 Go to Sign In Page
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-blue-800 mb-3">
                  Try refreshing the page or signing out and back in if you see
                  authentication failures.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={fixAuth}
                    className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    🔧 Fix Authentication
                  </button>
                  <button
                    onClick={signOut}
                    className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                  >
                    🚪 Sign Out & Re-login
                  </button>
                </div>
              </>
            )}
          </div>
        )}
    </div>
  );
}
