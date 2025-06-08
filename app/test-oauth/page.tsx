"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function TestOAuthPage() {
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const testOAuthFlow = async () => {
    setLoading(true);
    try {
      console.log("🔍 Testing OAuth flow...");

      if (!supabase) {
        throw new Error("Supabase client not available");
      }

      // Test OAuth URL generation
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          scopes: "email profile",
        },
      });

      if (error) {
        console.error("OAuth error:", error);
        setDebugInfo({ error: error.message, type: "oauth_error" });
      } else {
        console.log("OAuth data:", data);
        setDebugInfo({
          url: data.url,
          provider: data.provider,
          type: "oauth_success",
          redirectTo: `${window.location.origin}/auth/callback`,
        });

        // The user should be redirected automatically
        // If not, we can manually redirect
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      console.error("Test error:", error);
      setDebugInfo({
        error: error instanceof Error ? error.message : "Unknown error",
        type: "test_error",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentSession = async () => {
    try {
      if (!supabase) {
        throw new Error("Supabase client not available");
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      setDebugInfo({
        type: "session_check",
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        expiresAt: session?.expires_at,
        error: error?.message,
      });
    } catch (error) {
      setDebugInfo({
        type: "session_error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const testApiEndpoint = async () => {
    try {
      const response = await fetch("/api/test-oauth-flow");
      const data = await response.json();
      setDebugInfo({
        type: "api_test",
        ...data,
      });
    } catch (error) {
      setDebugInfo({
        type: "api_error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  if (process.env.NODE_ENV === "production") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Test page only available in development</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          OAuth Flow Test
        </h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="space-y-4">
            <Button
              onClick={testOAuthFlow}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Testing..." : "Test Google OAuth Flow"}
            </Button>

            <Button
              onClick={checkCurrentSession}
              variant="outline"
              className="w-full"
            >
              Check Current Session
            </Button>

            <Button
              onClick={testApiEndpoint}
              variant="outline"
              className="w-full"
            >
              Test API Endpoint
            </Button>
          </div>

          {debugInfo && (
            <div className="mt-6 bg-gray-100 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Debug Info:</h3>
              <pre className="text-xs overflow-auto whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">
            Expected Redirect URIs in Google Cloud Console:
          </h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• http://localhost:3000/auth/callback</li>
            <li>• http://localhost:54321/auth/v1/callback</li>
            <li>• https://gswduyodzdgucjscjtvz.supabase.co/auth/v1/callback</li>
            <li>• https://omahub-main.vercel.app/auth/callback</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
