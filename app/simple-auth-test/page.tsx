"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function SimpleAuthTest() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs((prev) => [...prev, logMessage]);
  };

  useEffect(() => {
    if (!supabase) {
      addLog("❌ Supabase client not available");
      return;
    }

    addLog("✅ Supabase client available");

    // Check initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        addLog(`❌ Session check error: ${error.message}`);
      } else {
        addLog(`📊 Initial session: ${session ? "Found" : "None"}`);
        setSession(session);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      addLog(`🔄 Auth state change: ${event}`);
      if (session) {
        addLog(`✅ Session established: ${session.user.email}`);
      }
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const testGoogleAuth = async () => {
    if (!supabase) {
      addLog("❌ Cannot test: Supabase client not available");
      return;
    }

    setLoading(true);
    addLog("🚀 Starting Google OAuth test...");

    try {
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
        addLog(`❌ OAuth error: ${error.message}`);
      } else {
        addLog(`✅ OAuth URL generated: ${data.url?.substring(0, 100)}...`);
        addLog("🔄 Redirecting to Google...");
        // Don't redirect automatically for testing
        // window.location.href = data.url!;
      }
    } catch (error) {
      addLog(
        `❌ Exception: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (!supabase) return;

    addLog("🚪 Signing out...");
    const { error } = await supabase.auth.signOut();
    if (error) {
      addLog(`❌ Sign out error: ${error.message}`);
    } else {
      addLog("✅ Signed out successfully");
    }
  };

  if (process.env.NODE_ENV === "production") {
    return <div>Test page only available in development</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Simple Auth Test</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Controls</h2>

            <div className="space-y-3">
              <button
                onClick={testGoogleAuth}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Testing..." : "Test Google OAuth (No Redirect)"}
              </button>

              {session && (
                <button
                  onClick={signOut}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Sign Out
                </button>
              )}
            </div>

            <div className="mt-4 p-3 bg-gray-100 rounded">
              <h3 className="font-semibold text-sm">Current Session:</h3>
              <p className="text-xs">
                {session
                  ? `✅ Logged in as ${session.user.email}`
                  : "❌ No session"}
              </p>
            </div>
          </div>

          {/* Logs */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Debug Logs</h2>
            <div className="bg-black text-green-400 p-3 rounded text-xs font-mono h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
            <button
              onClick={() => setLogs([])}
              className="mt-2 text-xs bg-gray-200 px-2 py-1 rounded"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* Expected Configuration */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">
            Google Cloud Console - Authorized redirect URIs:
          </h3>
          <div className="text-sm text-yellow-700 font-mono space-y-1">
            <div>✅ http://localhost:3000/auth/callback</div>
            <div>
              ✅ https://gswduyodzdgucjscjtvz.supabase.co/auth/v1/callback
            </div>
            <div>✅ https://omahub-main.vercel.app/auth/callback</div>
          </div>
        </div>
      </div>
    </div>
  );
}
