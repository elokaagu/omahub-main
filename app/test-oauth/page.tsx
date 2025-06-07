"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import GoogleOAuthButton from "@/components/auth/GoogleOAuthButton";

export default function TestOAuthPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [envCheck, setEnvCheck] = useState<any>({});

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev]);
    console.log(message);
  };

  useEffect(() => {
    // Check environment variables
    const env = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      googleClientId: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      nodeEnv: process.env.NODE_ENV,
      currentUrl:
        typeof window !== "undefined" ? window.location.origin : "unknown",
    };
    setEnvCheck(env);
    addLog("🔍 Environment check completed");
  }, []);

  const testSupabaseConnection = async () => {
    addLog("🧪 Testing Supabase connection...");

    if (!supabase) {
      addLog("❌ Supabase client not available");
      return;
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        addLog(`❌ Supabase connection failed: ${error.message}`);
      } else {
        addLog("✅ Supabase connection successful");
        addLog(`📊 Current session: ${data.session ? "Active" : "None"}`);
      }
    } catch (err) {
      addLog(`❌ Supabase test error: ${err}`);
    }
  };

  const testOAuthConfig = async () => {
    addLog("🔧 Testing OAuth configuration...");

    if (!supabase) {
      addLog("❌ Supabase client not available");
      return;
    }

    try {
      // This will fail if Google OAuth is not configured, but we can see the error
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true, // Don't actually redirect, just test the config
        },
      });

      if (error) {
        addLog(`⚠️ OAuth config issue: ${error.message}`);
        if (error.message.includes("Provider not found")) {
          addLog("💡 Google OAuth provider not configured in Supabase");
        }
      } else {
        addLog("✅ OAuth configuration looks good");
        if (data?.url) {
          addLog(`🔗 OAuth URL would be: ${data.url.substring(0, 50)}...`);
        }
      }
    } catch (err) {
      addLog(`❌ OAuth test error: ${err}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🧪 Google OAuth Test Lab
          </h1>

          {/* Environment Check */}
          <div className="mb-8 p-6 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">🔍 Environment Check</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Supabase URL:</span>
                <span
                  className={`ml-2 ${envCheck.supabaseUrl ? "text-green-600" : "text-red-600"}`}
                >
                  {envCheck.supabaseUrl ? "✅ Set" : "❌ Missing"}
                </span>
              </div>
              <div>
                <span className="font-medium">Supabase Key:</span>
                <span
                  className={`ml-2 ${envCheck.supabaseKey ? "text-green-600" : "text-red-600"}`}
                >
                  {envCheck.supabaseKey ? "✅ Set" : "❌ Missing"}
                </span>
              </div>
              <div>
                <span className="font-medium">Google Client ID:</span>
                <span
                  className={`ml-2 ${envCheck.googleClientId ? "text-green-600" : "text-orange-600"}`}
                >
                  {envCheck.googleClientId ? "✅ Set" : "⚠️ Not Set"}
                </span>
              </div>
              <div>
                <span className="font-medium">Environment:</span>
                <span className="ml-2 text-blue-600">{envCheck.nodeEnv}</span>
              </div>
              <div className="col-span-2">
                <span className="font-medium">Current URL:</span>
                <span className="ml-2 text-blue-600">
                  {envCheck.currentUrl}
                </span>
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="mb-8 space-y-4">
            <h2 className="text-xl font-semibold mb-4">🧪 Tests</h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={testSupabaseConnection}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Test Supabase Connection
              </button>
              <button
                onClick={testOAuthConfig}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Test OAuth Config
              </button>
              <button
                onClick={() => setLogs([])}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Clear Logs
              </button>
            </div>
          </div>

          {/* OAuth Button Test */}
          <div className="mb-8 p-6 bg-yellow-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">🔐 OAuth Button Test</h2>
            <p className="text-gray-600 mb-4">
              This will attempt the actual OAuth flow. Make sure you have Google
              OAuth configured first.
            </p>
            <div className="max-w-sm">
              <GoogleOAuthButton redirectTo="/test-oauth" />
            </div>
          </div>

          {/* Logs */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">📋 Logs</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500">
                  No logs yet. Run some tests!
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Configuration Guide */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">📚 Next Steps</h2>
            <div className="space-y-2 text-sm">
              <p>
                <strong>1. Google Cloud Console:</strong> Set up OAuth 2.0
                credentials
              </p>
              <p>
                <strong>2. Supabase Dashboard:</strong> Configure Google
                provider
              </p>
              <p>
                <strong>3. Environment Variables:</strong> Add Google Client ID
              </p>
              <p>
                <strong>4. Test:</strong> Use the OAuth button above
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
