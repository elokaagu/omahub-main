"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SessionPersistence } from "@/lib/utils/sessionPersistence";
import { Button } from "@/components/ui/button";

export default function TestSessionPersistencePage() {
  const { user, session, loading } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [sessionState, setSessionState] = useState<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[SESSION TEST] ${message}`);
  };

  useEffect(() => {
    addLog("Component mounted");

    // Check saved session state
    const saved = SessionPersistence.getSavedSessionState();
    setSessionState(saved);

    if (saved) {
      addLog(
        `Saved session found: ${saved.email} (expires: ${new Date(saved.expiresAt * 1000).toISOString()})`
      );
    } else {
      addLog("No saved session found");
    }

    // Listen for visibility changes
    const handleVisibilityChange = () => {
      addLog(`Tab visibility changed: ${document.visibilityState}`);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (user) {
      addLog(`User loaded: ${user.email} (role: ${user.role})`);
    } else if (!loading) {
      addLog("No user found");
    }
  }, [user, loading]);

  useEffect(() => {
    if (session) {
      addLog(
        `Session loaded: ${session.user.email} (expires: ${new Date(session.expires_at! * 1000).toISOString()})`
      );

      // Update session state display
      const saved = SessionPersistence.getSavedSessionState();
      setSessionState(saved);
    } else if (!loading) {
      addLog("No session found");
    }
  }, [session, loading]);

  const refreshSessionState = () => {
    const saved = SessionPersistence.getSavedSessionState();
    setSessionState(saved);
    addLog("Session state refreshed");
  };

  const clearLogs = () => {
    setLogs([]);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Session Persistence Test</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Session Persistence Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Auth State */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Current Auth State</h2>

          <div className="space-y-2">
            <p>
              <strong>Loading:</strong> {loading ? "Yes" : "No"}
            </p>
            <p>
              <strong>User:</strong> {user ? user.email : "None"}
            </p>
            <p>
              <strong>User Role:</strong> {user?.role || "N/A"}
            </p>
            <p>
              <strong>Session:</strong> {session ? "Active" : "None"}
            </p>
            {session && (
              <p>
                <strong>Session Expires:</strong>{" "}
                {new Date(session.expires_at! * 1000).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Saved Session State */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Saved Session State</h2>

          <div className="space-y-2">
            {sessionState ? (
              <>
                <p>
                  <strong>User ID:</strong> {sessionState.userId}
                </p>
                <p>
                  <strong>Email:</strong> {sessionState.email}
                </p>
                <p>
                  <strong>Expires At:</strong>{" "}
                  {new Date(sessionState.expiresAt * 1000).toLocaleString()}
                </p>
                <p>
                  <strong>Saved At:</strong>{" "}
                  {new Date(sessionState.timestamp).toLocaleString()}
                </p>
                <p>
                  <strong>Is Expired:</strong>{" "}
                  {SessionPersistence.isSessionExpired(sessionState)
                    ? "Yes"
                    : "No"}
                </p>
              </>
            ) : (
              <p>No saved session state</p>
            )}
          </div>

          <Button onClick={refreshSessionState} className="mt-4">
            Refresh Session State
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-6 rounded-lg mt-6">
        <h2 className="text-lg font-semibold mb-4">Test Instructions</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Make sure you're logged in</li>
          <li>Open this page in multiple tabs</li>
          <li>Switch between tabs and watch the logs</li>
          <li>The session should persist across tabs without logging out</li>
          <li>Check the browser console for detailed debug logs</li>
        </ol>
      </div>

      {/* Logs */}
      <div className="bg-gray-50 p-6 rounded-lg mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Session Logs</h2>
          <Button onClick={clearLogs} variant="outline" size="sm">
            Clear Logs
          </Button>
        </div>

        <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p>No logs yet...</p>
          ) : (
            logs.map((log, index) => <div key={index}>{log}</div>)
          )}
        </div>
      </div>
    </div>
  );
}
