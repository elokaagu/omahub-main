"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function TestCookieSyncPage() {
  const { user, session, loading } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [testEmail] = useState("eloka.agu@icloud.com");
  const [testPassword] = useState("newpassword123");
  const [isTestingLogin, setIsTestingLogin] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    addLog("🔍 Cookie sync test page loaded");
    addLog(`Auth loading: ${loading}`);
    addLog(`User: ${user ? `${user.email} (${user.role})` : "null"}`);
    addLog(`Session: ${session ? "exists" : "null"}`);

    // Check for session refresh signal
    const urlParams = new URLSearchParams(window.location.search);
    const sessionRefresh = urlParams.get("session_refresh");
    if (sessionRefresh === "true") {
      addLog("✅ Session refresh signal detected in URL");
    }
  }, [user, session, loading]);

  const testLoginWithCookieSync = async () => {
    addLog("🧪 Testing login with cookie synchronization...");
    setIsTestingLogin(true);

    try {
      // Step 1: API Login
      addLog("Step 1: Calling login API...");
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
      addLog(
        `API Response: ${response.status} - ${data.success ? "Success" : "Failed"}`
      );

      if (data.success) {
        // Step 2: Check client session immediately
        addLog("Step 2: Checking client session immediately...");
        if (supabase) {
          const { data: immediateSession } = await supabase.auth.getSession();
          addLog(
            `Immediate session: ${immediateSession.session ? "exists" : "null"}`
          );
        }

        // Step 3: Wait and check again
        addLog("Step 3: Waiting 1.5 seconds for sync...");
        await new Promise((resolve) => setTimeout(resolve, 1500));

        if (supabase) {
          const { data: delayedSession } = await supabase.auth.getSession();
          addLog(
            `Delayed session: ${delayedSession.session ? "exists" : "null"}`
          );

          if (delayedSession.session) {
            addLog(`✅ Session user: ${delayedSession.session.user.email}`);
            addLog(
              `✅ Session expires: ${new Date(delayedSession.session.expires_at! * 1000).toLocaleString()}`
            );
          }
        }

        // Step 4: Check auth context state
        addLog("Step 4: Checking auth context state...");
        addLog(`Auth context user: ${user ? user.email : "null"}`);
        addLog(`Auth context session: ${session ? "exists" : "null"}`);

        // Step 5: Test redirect with session_refresh
        addLog("Step 5: Testing redirect with session_refresh parameter...");
        addLog("Would redirect to: /test-cookie-sync?session_refresh=true");

        // Don't actually redirect, just simulate
        const testUrl = new URL(window.location.href);
        testUrl.searchParams.set("session_refresh", "true");
        addLog(`Simulated redirect URL: ${testUrl.toString()}`);
      } else {
        addLog(`❌ Login failed: ${data.error}`);
      }
    } catch (error) {
      addLog(`❌ Test error: ${error}`);
    } finally {
      setIsTestingLogin(false);
    }
  };

  const testSessionRefreshSignal = () => {
    addLog("🔄 Testing session refresh signal...");
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("session_refresh", "true");
    window.location.href = currentUrl.toString();
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const checkCurrentCookies = () => {
    addLog("🍪 Checking current cookies...");
    if (typeof window !== "undefined") {
      const cookies = document.cookie.split(";");
      const authCookies = cookies.filter(
        (cookie) =>
          cookie.includes("supabase") ||
          cookie.includes("auth") ||
          cookie.includes("sb-")
      );

      if (authCookies.length > 0) {
        authCookies.forEach((cookie) => {
          const [name, value] = cookie.trim().split("=");
          addLog(
            `Cookie: ${name} = ${value ? value.substring(0, 20) + "..." : "empty"}`
          );
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
          Cookie Synchronization Test
        </h1>

        {/* Current State */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current State</h2>
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

          {/* Session Refresh Signal Check */}
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <strong>URL Parameters:</strong>
            <div className="text-sm mt-1">
              {new URLSearchParams(window.location.search).get(
                "session_refresh"
              ) === "true" ? (
                <span className="text-green-600">
                  ✅ session_refresh=true detected
                </span>
              ) : (
                <span className="text-gray-600">
                  ❌ No session_refresh parameter
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              onClick={testLoginWithCookieSync}
              disabled={isTestingLogin}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isTestingLogin ? "Testing..." : "Test Login + Sync"}
            </Button>
            <Button
              onClick={testSessionRefreshSignal}
              className="bg-green-600 hover:bg-green-700"
            >
              Test Refresh Signal
            </Button>
            <Button
              onClick={checkCurrentCookies}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Check Cookies
            </Button>
            <Button onClick={clearLogs} variant="outline">
              Clear Logs
            </Button>
          </div>
        </div>

        {/* Test Logs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Logs</h2>
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
          <h3 className="text-lg font-semibold mb-2">
            Cookie Sync Test Instructions:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              <strong>Test Login + Sync:</strong> Tests the complete login flow
              with cookie synchronization
            </li>
            <li>
              <strong>Test Refresh Signal:</strong> Adds session_refresh=true to
              URL to test auth context refresh
            </li>
            <li>
              <strong>Check Cookies:</strong> Shows current auth cookies in
              browser
            </li>
            <li>
              Watch the logs to see where cookie synchronization might be
              failing
            </li>
            <li>
              The goal is to see session available immediately after login API
              call
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
