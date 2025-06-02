"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TestOAuthPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testOAuthConfig = async () => {
    setLoading(true);
    setResult(null);

    try {
      if (!supabase) {
        throw new Error("Supabase client not available");
      }

      const currentUrl = window.location.origin;
      const redirectUrl = `${currentUrl}/auth/callback`;

      console.log("🔗 Testing OAuth with redirect URL:", redirectUrl);

      // Test the OAuth configuration without actually signing in
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          scopes: "email profile",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.error("❌ OAuth test failed:", error);
        setResult({
          success: false,
          error: error.message,
          details: error,
        });
      } else {
        console.log("✅ OAuth test successful:", data);
        setResult({
          success: true,
          data,
          redirectUrl,
        });
      }
    } catch (error: any) {
      console.error("❌ OAuth test exception:", error);
      setResult({
        success: false,
        error: error.message,
        details: error,
      });
    } finally {
      setLoading(false);
    }
  };

  const currentUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  const expectedCallback = `${currentUrl}/auth/callback`;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🧪 OAuth Configuration Test
          </h1>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <h3 className="text-blue-800 font-semibold mb-2">
              📋 Current Configuration
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Current Origin:</strong>{" "}
                <code className="bg-blue-100 px-1 rounded">{currentUrl}</code>
              </p>
              <p>
                <strong>Expected Callback:</strong>{" "}
                <code className="bg-blue-100 px-1 rounded">
                  {expectedCallback}
                </code>
              </p>
              <p>
                <strong>Supabase URL:</strong>{" "}
                <code className="bg-blue-100 px-1 rounded">
                  gswduyodzdgucjscjtvz.supabase.co
                </code>
              </p>
            </div>
          </div>

          <div className="mb-6">
            <button
              onClick={testOAuthConfig}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Testing OAuth..."
                : "🚀 Test Google OAuth Configuration"}
            </button>
          </div>

          {result && (
            <div
              className={`rounded-md p-4 mb-6 ${
                result.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <h3
                className={`font-semibold mb-2 ${
                  result.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {result.success
                  ? "✅ OAuth Test Successful"
                  : "❌ OAuth Test Failed"}
              </h3>

              {result.success ? (
                <div className="text-green-700 space-y-2">
                  <p>OAuth configuration is working correctly!</p>
                  <p>
                    <strong>Redirect URL:</strong>{" "}
                    <code className="bg-green-100 px-1 rounded">
                      {result.redirectUrl}
                    </code>
                  </p>
                  {result.data?.url && (
                    <p>
                      <strong>OAuth URL Generated:</strong>{" "}
                      <code className="bg-green-100 px-1 rounded text-xs break-all">
                        {result.data.url}
                      </code>
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-red-700 space-y-2">
                  <p>
                    <strong>Error:</strong> {result.error}
                  </p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">
                        View Error Details
                      </summary>
                      <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <h3 className="text-yellow-800 font-semibold mb-2">
              ⚠️ If OAuth Test Fails
            </h3>
            <div className="text-yellow-700 space-y-2 text-sm">
              <p>
                <strong>1. Check Supabase Dashboard:</strong>
              </p>
              <ul className="list-disc list-inside ml-4">
                <li>Go to Authentication → Providers → Google</li>
                <li>Ensure Google provider is enabled</li>
                <li>Verify Client ID and Secret are correct</li>
                <li>
                  Add redirect URL:{" "}
                  <code className="bg-yellow-100 px-1 rounded">
                    {expectedCallback}
                  </code>
                </li>
              </ul>

              <p>
                <strong>2. Check Google Cloud Console:</strong>
              </p>
              <ul className="list-disc list-inside ml-4">
                <li>Verify OAuth 2.0 Client ID is configured</li>
                <li>
                  Add authorized redirect URI:{" "}
                  <code className="bg-yellow-100 px-1 rounded">
                    {expectedCallback}
                  </code>
                </li>
                <li>Ensure OAuth consent screen is configured</li>
              </ul>
            </div>
          </div>

          <div className="flex space-x-4">
            <a
              href="/auth/debug"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              🔍 Full Debug Console
            </a>
            <a
              href="/auth/clear"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              🧹 Clear Auth State
            </a>
            <a
              href="/login"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              🔐 Go to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
