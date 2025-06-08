"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function DebugLoginFlowPage() {
  const { user, session, loading } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [testEmail, setTestEmail] = useState("eloka.agu@icloud.com");
  const [testPassword, setTestPassword] = useState("newpassword123");
  const [isTestingLogin, setIsTestingLogin] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    addLog("🔍 Debug page loaded");
    addLog(`Auth loading: ${loading}`);
    addLog(`User: ${user ? `${user.email} (${user.role})` : "null"}`);
    addLog(`Session: ${session ? "exists" : "null"}`);
  }, [user, session, loading]);

  const testDirectAPILogin = async () => {
    addLog("🧪 Testing direct API login...");
    setIsTestingLogin(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      const data = await response.json();
      addLog(`API Response Status: ${response.status}`);
      addLog(`API Response: ${JSON.stringify(data, null, 2)}`);

      if (data.success) {
        addLog("✅ API login successful");

        // Check if session is now available
        setTimeout(async () => {
          if (!supabase) {
            addLog("❌ Supabase client not available");
            return;
          }
          const { data: sessionData } = await supabase.auth.getSession();
          addLog(
            `Session after API login: ${sessionData.session ? "exists" : "null"}`
          );

          if (sessionData.session) {
            addLog(`Session user: ${sessionData.session.user.email}`);
            addLog(
              `Session expires: ${new Date(sessionData.session.expires_at! * 1000).toLocaleString()}`
            );
          }
        }, 1000);
      } else {
        addLog("❌ API login failed");
      }
    } catch (error) {
      addLog(`❌ API login error: ${error}`);
    } finally {
      setIsTestingLogin(false);
    }
  };

  const testSupabaseDirectLogin = async () => {
    addLog("🧪 Testing direct Supabase login...");
    setIsTestingLogin(true);

    try {
      if (!supabase) {
        addLog("❌ Supabase client not available");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (error) {
        addLog(`❌ Supabase login error: ${error.message}`);
      } else {
        addLog("✅ Supabase login successful");
        addLog(`User: ${data.user.email}`);
        addLog(`Session: ${data.session ? "exists" : "null"}`);
      }
    } catch (error) {
      addLog(`❌ Supabase login exception: ${error}`);
    } finally {
      setIsTestingLogin(false);
    }
  };

  const testSessionRefresh = async () => {
    addLog("🔄 Testing session refresh...");

    try {
      if (!supabase) {
        addLog("❌ Supabase client not available");
        return;
      }

      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        addLog(`❌ Session refresh error: ${error.message}`);
      } else {
        addLog("✅ Session refresh successful");
        addLog(`Session: ${data.session ? "exists" : "null"}`);
        if (data.session) {
          addLog(`User: ${data.session.user.email}`);
        }
      }
    } catch (error) {
      addLog(`❌ Session refresh exception: ${error}`);
    }
  };

  const testMiddlewareSession = async () => {
    addLog("🛡️ Testing middleware session check...");

    try {
      const response = await fetch("/api/test-session", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      addLog(`Middleware session check: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      addLog(`❌ Middleware session check error: ${error}`);
    }
  };

  const simulateLoginFlow = async () => {
    addLog("🎭 Simulating complete login flow...");
    setIsTestingLogin(true);

    try {
      // Step 1: API Login
      addLog("Step 1: API Login");
      await testDirectAPILogin();

      // Step 2: Wait for auth context to update
      addLog("Step 2: Waiting for auth context update...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 3: Check current auth state
      addLog("Step 3: Checking auth state");
      addLog(`Current user: ${user ? user.email : "null"}`);
      addLog(`Current session: ${session ? "exists" : "null"}`);

      // Step 4: Test redirect
      addLog("Step 4: Testing redirect to studio...");
      // Don't actually redirect, just log what would happen
      if (user && session) {
        addLog("✅ Would redirect to /studio successfully");
      } else {
        addLog("❌ Would redirect back to /login - this is the problem!");
      }
    } catch (error) {
      addLog(`❌ Login flow simulation error: ${error}`);
    } finally {
      setIsTestingLogin(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const checkCookies = () => {
    addLog("🍪 Checking cookies...");
    if (typeof window !== "undefined") {
      const cookies = document.cookie.split(";");
      const authCookies = cookies.filter(
        (cookie) => cookie.includes("supabase") || cookie.includes("auth")
      );

      if (authCookies.length > 0) {
        authCookies.forEach((cookie) => {
          addLog(`Cookie: ${cookie.trim()}`);
        });
      } else {
        addLog("❌ No auth cookies found");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/50 to-white py-12">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-3xl font-canela text-oma-plum mb-8">
          Login Flow Debug
        </h1>

        {/* Current Auth State */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Auth State</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Loading:</strong> {loading ? "✅ Yes" : "❌ No"}
            </div>
            <div>
              <strong>User:</strong> {user ? `✅ ${user.email}` : "❌ None"}
            </div>
            <div>
              <strong>Session:</strong> {session ? "✅ Exists" : "❌ None"}
            </div>
          </div>
          {user && (
            <div className="mt-4 p-3 bg-green-50 rounded">
              <strong>User Details:</strong>
              <pre className="text-xs mt-2">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Test Credentials */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Credentials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email:</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Password:
              </label>
              <input
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={testDirectAPILogin}
              disabled={isTestingLogin}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Test API Login
            </Button>
            <Button
              onClick={testSupabaseDirectLogin}
              disabled={isTestingLogin}
              className="bg-green-600 hover:bg-green-700"
            >
              Test Supabase Login
            </Button>
            <Button
              onClick={testSessionRefresh}
              disabled={isTestingLogin}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Refresh Session
            </Button>
            <Button
              onClick={testMiddlewareSession}
              disabled={isTestingLogin}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Test Middleware
            </Button>
            <Button
              onClick={simulateLoginFlow}
              disabled={isTestingLogin}
              className="bg-red-600 hover:bg-red-700 md:col-span-2"
            >
              Simulate Full Flow
            </Button>
            <Button
              onClick={checkCookies}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Check Cookies
            </Button>
            <Button onClick={clearLogs} variant="outline">
              Clear Logs
            </Button>
          </div>
        </div>

        {/* Debug Logs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Debug Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>First, check your current auth state above</li>
            <li>
              If not logged in, try "Test API Login" to see if the API works
            </li>
            <li>
              Try "Test Supabase Login" to see if direct Supabase auth works
            </li>
            <li>Use "Simulate Full Flow" to test the complete login process</li>
            <li>Check the logs to see where the process fails</li>
            <li>Use "Check Cookies" to verify auth cookies are being set</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
