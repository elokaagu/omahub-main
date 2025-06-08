"use client";

import { useState } from "react";

export default function TestOAuthCallbackPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[TEST OAUTH] ${message}`);
  };

  const testCallbackEndpoint = async () => {
    setLoading(true);
    addLog("Testing OAuth callback endpoint...");

    try {
      // Test the callback endpoint with a fake code
      const testUrl = `/auth/callback?code=test_code&redirect_to=/test-oauth-callback`;
      addLog(`Testing URL: ${testUrl}`);

      const response = await fetch(testUrl, {
        method: "GET",
        redirect: "manual", // Don't follow redirects
      });

      addLog(`Response status: ${response.status}`);
      addLog(
        `Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`
      );

      if (response.status === 0) {
        addLog("Response was redirected (expected for OAuth callback)");
      } else {
        const text = await response.text();
        addLog(`Response body: ${text.substring(0, 200)}...`);
      }
    } catch (error) {
      addLog(`Error testing callback: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testGoogleOAuth = () => {
    addLog("Initiating Google OAuth test...");
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=YOUR_GOOGLE_CLIENT_ID&` +
      `redirect_uri=${encodeURIComponent(window.location.origin + "/auth/callback")}&` +
      `response_type=code&` +
      `scope=email%20profile&` +
      `state=test_state`;

    addLog(`Would redirect to: ${authUrl}`);
    addLog(
      "Note: This is just a test URL - don't actually visit it without proper Google OAuth setup"
    );
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            OAuth Callback Test
          </h1>

          <div className="space-y-4 mb-6">
            <button
              onClick={testCallbackEndpoint}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Testing..." : "Test Callback Endpoint"}
            </button>

            <button
              onClick={testGoogleOAuth}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-2"
            >
              Test Google OAuth URL
            </button>

            <button
              onClick={clearLogs}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 ml-2"
            >
              Clear Logs
            </button>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Test Logs</h2>
            <div className="max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500">
                  No logs yet. Click buttons above to start testing.
                </p>
              ) : (
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {logs.join("\n")}
                </pre>
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              OAuth Flow Debug Info
            </h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>
                <strong>Current URL:</strong>{" "}
                {typeof window !== "undefined"
                  ? window.location.href
                  : "Unknown"}
              </p>
              <p>
                <strong>Expected Callback:</strong>{" "}
                {typeof window !== "undefined"
                  ? window.location.origin + "/auth/callback"
                  : "Unknown"}
              </p>
              <p>
                <strong>Test Redirect:</strong> /test-oauth-callback
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
