"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export default function TestSessionPersistencePage() {
  const { user, session, loading } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [sessionChecks, setSessionChecks] = useState(0);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs((prev) => [logMessage, ...prev.slice(0, 19)]); // Keep last 20 logs
    console.log(logMessage);
  };

  useEffect(() => {
    addLog("🔍 Session persistence test initialized");

    // Monitor page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        addLog("👁️ Tab became hidden");
      } else {
        addLog("👁️ Tab became visible");
        setTabSwitchCount((prev) => prev + 1);

        // Check session after tab becomes visible
        setTimeout(() => {
          checkSession();
        }, 100);
      }
    };

    // Monitor auth state changes
    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        addLog(
          `🔄 Auth state changed: ${event} (Session: ${session ? "exists" : "null"})`
        );
      });

      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        subscription.unsubscribe();
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      };
    }
  }, []);

  const checkSession = async () => {
    setSessionChecks((prev) => prev + 1);
    addLog("🔍 Manually checking session...");

    if (!supabase) {
      addLog("❌ Supabase client not available");
      return;
    }

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        addLog(`❌ Session check error: ${error.message}`);
      } else if (data.session) {
        addLog(`✅ Session exists: ${data.session.user.email}`);
      } else {
        addLog("❌ No session found");
      }
    } catch (error) {
      addLog(`❌ Session check failed: ${error}`);
    }
  };

  const testTabSwitch = () => {
    addLog("🧪 Testing tab switch simulation...");
    addLog(
      "📝 Instructions: Switch to another tab, wait 5 seconds, then come back"
    );
    addLog("📊 Current session should persist after tab switch");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading session...</p>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            No Session Found
          </h1>
          <p className="text-gray-600 mb-4">
            You need to be logged in to test session persistence.
          </p>
          <a
            href="/login"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Session Persistence Test</h1>

        {/* Session Status */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Current Session Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Status:</strong>{" "}
              <span className="text-green-600">✅ Authenticated</span>
            </div>
            <div>
              <strong>Email:</strong> {user.email}
            </div>
            <div>
              <strong>User ID:</strong> {user.id}
            </div>
            <div>
              <strong>Role:</strong> {user.role}
            </div>
            <div>
              <strong>Tab Switches:</strong> {tabSwitchCount}
            </div>
            <div>
              <strong>Session Checks:</strong> {sessionChecks}
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="space-x-4">
            <button
              onClick={checkSession}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Check Session
            </button>
            <button
              onClick={testTabSwitch}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Test Tab Switch
            </button>
            <button
              onClick={() => setLogs([])}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">
            How to Test
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-700">
            <li>Note your current session status above</li>
            <li>Click "Test Tab Switch" to start the test</li>
            <li>Switch to another browser tab or application</li>
            <li>Wait for 5-10 seconds</li>
            <li>Switch back to this tab</li>
            <li>Check if you're still logged in (session should persist)</li>
            <li>Review the logs below for any session changes</li>
          </ol>
        </div>

        {/* Logs */}
        <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
          <h3 className="text-white font-bold mb-2">
            Session Persistence Logs
          </h3>
          <div className="max-h-96 overflow-y-auto">
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
    </div>
  );
}
