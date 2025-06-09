"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DebugSessionPage() {
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs((prev) => [logMessage, ...prev]);
    console.log(logMessage);
  };

  useEffect(() => {
    checkSession();

    // Set up auth state change listener
    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        addLog(`🔄 Auth state changed: ${event}`);
        if (session) {
          addLog(`✅ Session updated: ${session.user.email}`);
          setSessionData(session);
        } else {
          addLog("❌ Session cleared");
          setSessionData(null);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const checkSession = async () => {
    addLog("🔍 Checking frontend session...");

    try {
      if (!supabase) {
        addLog("❌ Supabase client not available");
        setLoading(false);
        return;
      }

      // Check session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        addLog(`❌ Session error: ${error.message}`);
      } else if (session) {
        addLog(`✅ Session found: ${session.user.email}`);
        setSessionData(session);
      } else {
        addLog("❌ No session found");
      }

      // Check user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        addLog(`❌ User error: ${userError.message}`);
      } else if (user) {
        addLog(`✅ User found: ${user.email}`);
      } else {
        addLog("❌ No user found");
      }

      // Test API call
      addLog("🧪 Testing API call...");
      const response = await fetch("/api/test-login-flow");
      const apiData = await response.json();

      if (apiData.session?.exists) {
        addLog(`✅ API session exists: ${apiData.session.email}`);
      } else {
        addLog("❌ API session not found");
      }
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    addLog("🧪 Testing login...");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "eloka.agu@icloud.com",
          password: "newpassword123",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        addLog("✅ Login successful!");
        addLog(`👤 User: ${data.user?.email}`);

        // If login response indicates session refresh needed
        if (data.refreshSession && supabase) {
          addLog("🔄 Refreshing frontend session...");

          // Force refresh the session
          await supabase.auth.refreshSession();

          // Wait a bit then check session
          setTimeout(() => {
            checkSession();
          }, 1000);
        } else {
          // Refresh session check
          setTimeout(() => {
            checkSession();
          }, 1000);
        }
      } else {
        addLog(`❌ Login failed: ${data.error}`);
      }
    } catch (error) {
      addLog(`❌ Login error: ${error}`);
    }
  };

  const forceRefreshSession = async () => {
    addLog("🔄 Force refreshing session...");

    if (!supabase) {
      addLog("❌ Supabase client not available");
      return;
    }

    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        addLog(`❌ Refresh error: ${error.message}`);
      } else {
        addLog("✅ Session refreshed successfully");
        if (data.session) {
          addLog(`👤 Refreshed user: ${data.session.user.email}`);
          setSessionData(data.session);
        }
      }
    } catch (error) {
      addLog(`❌ Refresh error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Frontend Session Debug</h1>

        {/* Session Status */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Session Status</h2>
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : sessionData ? (
            <div className="space-y-2 text-sm">
              <div>
                <strong>Status:</strong>{" "}
                <span className="text-green-600">✅ Authenticated</span>
              </div>
              <div>
                <strong>Email:</strong> {sessionData.user.email}
              </div>
              <div>
                <strong>User ID:</strong> {sessionData.user.id}
              </div>
              <div>
                <strong>Provider:</strong>{" "}
                {sessionData.user.app_metadata?.provider || "email"}
              </div>
              <div>
                <strong>Expires At:</strong>{" "}
                {new Date(sessionData.expires_at * 1000).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-red-600">❌ No active session</div>
          )}
        </div>

        {/* Test Buttons */}
        <div className="mb-8 space-y-4">
          <button
            onClick={checkSession}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Session Check
          </button>
          <button
            onClick={testLogin}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 ml-4"
          >
            Test Email Login
          </button>
          <button
            onClick={forceRefreshSession}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 ml-4"
          >
            Force Refresh Session
          </button>
        </div>

        {/* Logs */}
        <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
          <h3 className="text-white font-bold mb-2">Debug Logs</h3>
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
    </div>
  );
}
