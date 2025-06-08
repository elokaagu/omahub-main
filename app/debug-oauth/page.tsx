"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

export default function DebugOAuthPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [session, setSession] = useState<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[DEBUG OAUTH] ${message}`);
  };

  const checkSession = async () => {
    try {
      addLog("Checking current session...");

      if (!supabase) {
        addLog("Supabase client not available");
        return;
      }

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        addLog(`Session check error: ${error.message}`);
      } else {
        addLog(
          `Session check result: ${data.session ? "Session exists" : "No session"}`
        );
        setSession(data.session);

        if (data.session) {
          addLog(`User: ${data.session.user.email}`);
          addLog(
            `Session expires: ${new Date(data.session.expires_at! * 1000).toISOString()}`
          );
        }
      }
    } catch (error) {
      addLog(`Session check failed: ${error}`);
    }
  };

  const testOAuthFlow = async () => {
    try {
      addLog("Starting OAuth test flow...");

      if (!supabase) {
        addLog("Supabase client not available");
        return;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent("/debug-oauth")}`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          scopes: "email profile",
        },
      });

      if (error) {
        addLog(`OAuth initiation error: ${error.message}`);
      } else {
        addLog("OAuth initiated successfully - redirecting...");
      }
    } catch (error) {
      addLog(`OAuth test failed: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setSession(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            OAuth Debug Page
          </h1>

          <div className="space-y-4 mb-6">
            <button
              onClick={checkSession}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Check Current Session
            </button>

            <button
              onClick={testOAuthFlow}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-2"
            >
              Test OAuth Flow
            </button>

            <button
              onClick={clearLogs}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 ml-2"
            >
              Clear Logs
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">
              Google Sign-In Component
            </h2>
            <GoogleSignInButton redirectTo="/debug-oauth" />
          </div>

          {session && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
              <h2 className="text-lg font-semibold text-green-800 mb-2">
                Current Session
              </h2>
              <pre className="text-sm text-green-700 overflow-x-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Debug Logs</h2>
            <div className="max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500">
                  No logs yet. Click buttons above to start debugging.
                </p>
              ) : (
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {logs.join("\n")}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
