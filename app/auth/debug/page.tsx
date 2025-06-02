"use client";

import { useState, useEffect } from "react";
import { AuthDebugger } from "@/lib/utils/authDebug";
import { signInWithOAuth } from "@/lib/services/authService";

export default function AuthDebugPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    // Initial diagnosis
    runDiagnosis();
  }, []);

  const runDiagnosis = async () => {
    setIsRunning(true);
    AuthDebugger.clearLogs();

    try {
      await AuthDebugger.diagnoseAuthState();
      await AuthDebugger.testGoogleOAuth();

      const newLogs = AuthDebugger.getLogs();
      setLogs(newLogs);

      const diagnostics = AuthDebugger.exportDiagnostics();
      setDiagnostics(diagnostics);
    } catch (error) {
      console.error("Diagnosis failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const testGoogleAuth = async () => {
    setIsRunning(true);
    try {
      AuthDebugger.log("🧪 Testing Google OAuth flow...");

      // Check for token refresh loop first
      if (AuthDebugger.detectTokenRefreshLoop()) {
        AuthDebugger.error("Token refresh loop detected! Aborting OAuth test.");
        setTestResults({ error: "Token refresh loop detected" });
        return;
      }

      const result = await signInWithOAuth("google");
      AuthDebugger.log("✅ Google OAuth test successful", result);
      setTestResults({ success: true, data: result });
    } catch (error: any) {
      AuthDebugger.error("❌ Google OAuth test failed", error);
      setTestResults({ error: error.message });
    } finally {
      setIsRunning(false);
      setLogs(AuthDebugger.getLogs());
    }
  };

  const emergencyReset = async () => {
    setIsRunning(true);
    try {
      await AuthDebugger.emergencyAuthReset();
      setLogs(AuthDebugger.getLogs());
      // Refresh the page after reset
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Emergency reset failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const exportLogs = () => {
    const data = AuthDebugger.exportDiagnostics();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auth-debug-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3001";
  const expectedCallback = `${currentUrl}/auth/callback`;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🔍 Auth Debug Console
          </h1>

          {/* OAuth Callback Issue Alert */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <h3 className="text-yellow-800 font-semibold mb-2">
              ⚠️ OAuth Callback URL Issue Detected
            </h3>
            <p className="text-yellow-700 mb-3">
              You're being redirected to{" "}
              <code className="bg-yellow-100 px-1 rounded">
                gswduyodzdgucjscjtvz.supabase.co/auth/v1/callback
              </code>{" "}
              instead of your local callback.
            </p>
            <div className="bg-yellow-100 p-3 rounded text-sm">
              <p className="font-semibold mb-2">
                🔧 Fix in Supabase Dashboard:
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Go to your Supabase dashboard → Authentication → Providers
                </li>
                <li>Click on Google provider</li>
                <li>In "Redirect URLs", make sure you have:</li>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>
                    <code className="bg-white px-1 rounded">
                      {expectedCallback}
                    </code>
                  </li>
                  <li>
                    <code className="bg-white px-1 rounded">
                      http://localhost:3000/auth/callback
                    </code>
                  </li>
                  <li>
                    <code className="bg-white px-1 rounded">
                      https://your-domain.com/auth/callback
                    </code>
                  </li>
                </ul>
                <li>Save the configuration</li>
              </ol>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <button
              onClick={runDiagnosis}
              disabled={isRunning}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isRunning ? "Running..." : "🔍 Run Diagnosis"}
            </button>

            <button
              onClick={testGoogleAuth}
              disabled={isRunning}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isRunning ? "Testing..." : "🧪 Test Google Auth"}
            </button>

            <button
              onClick={emergencyReset}
              disabled={isRunning}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isRunning ? "Resetting..." : "🚨 Emergency Reset"}
            </button>

            <button
              onClick={exportLogs}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              📋 Export Logs
            </button>
          </div>

          {/* Test Results */}
          {testResults.error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <h3 className="text-red-800 font-semibold">❌ Test Failed</h3>
              <p className="text-red-700">{testResults.error}</p>
            </div>
          )}

          {testResults.success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <h3 className="text-green-800 font-semibold">
                ✅ Test Successful
              </h3>
              <p className="text-green-700">
                Google OAuth flow initiated successfully
              </p>
            </div>
          )}

          {/* Environment Info */}
          {diagnostics && (
            <div className="bg-gray-50 rounded-md p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3">🌍 Environment</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Node Environment:</strong>{" "}
                  {diagnostics.environment.nodeEnv}
                </div>
                <div>
                  <strong>Supabase URL:</strong>{" "}
                  {diagnostics.environment.hasSupabaseUrl ? "✅" : "❌"}
                </div>
                <div>
                  <strong>Supabase Key:</strong>{" "}
                  {diagnostics.environment.hasSupabaseKey ? "✅" : "❌"}
                </div>
                <div>
                  <strong>Current URL:</strong> {diagnostics.environment.url}
                </div>
                <div className="col-span-2">
                  <strong>Expected Callback:</strong>{" "}
                  <code className="bg-gray-200 px-1 rounded text-xs">
                    {expectedCallback}
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* Logs */}
          <div className="bg-gray-900 text-green-400 rounded-md p-4 font-mono text-sm max-h-96 overflow-y-auto">
            <h3 className="text-white font-semibold mb-3">📝 Debug Logs</h3>
            {logs.length === 0 ? (
              <p className="text-gray-400">
                No logs yet. Run a diagnosis to see output.
              </p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`mb-1 ${
                    log.level === "error"
                      ? "text-red-400"
                      : log.level === "warn"
                        ? "text-yellow-400"
                        : "text-green-400"
                  }`}
                >
                  <span className="text-gray-400">[{log.timestamp}]</span>{" "}
                  {log.message}
                  {log.data && (
                    <pre className="ml-4 text-xs text-gray-300">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Supabase Configuration Guide */}
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h3 className="text-blue-800 font-semibold mb-2">
              🔧 Supabase Google OAuth Configuration
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong>1. Supabase Dashboard:</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Go to Authentication → Providers → Google</li>
                  <li>Enable Google provider</li>
                  <li>
                    Add your Google Client ID:{" "}
                    <code className="bg-blue-100 px-1 rounded">
                      815616743762-mrikrcpvkpfgonhns3p26s0bb6lif60q.apps.googleusercontent.com
                    </code>
                  </li>
                  <li>Add your Google Client Secret</li>
                </ul>
              </div>
              <div>
                <strong>2. Redirect URLs (add all of these):</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>
                    <code className="bg-blue-100 px-1 rounded">
                      http://localhost:3000/auth/callback
                    </code>
                  </li>
                  <li>
                    <code className="bg-blue-100 px-1 rounded">
                      http://localhost:3001/auth/callback
                    </code>
                  </li>
                  <li>
                    <code className="bg-blue-100 px-1 rounded">
                      https://your-production-domain.com/auth/callback
                    </code>
                  </li>
                </ul>
              </div>
              <div>
                <strong>3. Google Cloud Console:</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Add the same redirect URLs to your Google OAuth app</li>
                  <li>Make sure the OAuth consent screen is configured</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 p-4 bg-green-50 rounded-md">
            <h3 className="text-green-800 font-semibold mb-2">
              🚀 Quick Actions
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                <strong>If you see token refresh loops:</strong> Click
                "Emergency Reset" then try auth again
              </p>
              <p>
                <strong>If redirected to Supabase callback:</strong> Fix the
                redirect URLs in Supabase dashboard
              </p>
              <p>
                <strong>If Google OAuth fails:</strong> Check both Supabase and
                Google Cloud Console configurations
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-6 flex space-x-4">
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
            <a href="/" className="text-blue-600 hover:text-blue-800 underline">
              🏠 Go Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
