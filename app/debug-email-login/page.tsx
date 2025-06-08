"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { signIn } from "@/lib/services/authService";

export default function DebugEmailLoginPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState("eloka.agu@icloud.com");
  const [testPassword, setTestPassword] = useState("");

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[DEBUG EMAIL] ${message}`);
  };

  const testDirectSupabaseLogin = async () => {
    setLoading(true);
    addLog("Testing direct Supabase email login...");

    try {
      if (!supabase) {
        addLog("❌ Supabase client not available");
        return;
      }

      addLog(`📧 Email: ${testEmail}`);
      addLog(`🔑 Password: ${"*".repeat(testPassword.length)}`);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (error) {
        addLog(`❌ Direct Supabase login error: ${error.message}`);
        addLog(`❌ Error code: ${error.name || "Unknown"}`);

        // Provide specific guidance based on error
        if (error.message.includes("Invalid login credentials")) {
          addLog("💡 This could mean:");
          addLog("   1. Email doesn't exist in Supabase Auth");
          addLog("   2. Password is incorrect");
          addLog("   3. User exists but email not confirmed");
        } else if (error.message.includes("Email not confirmed")) {
          addLog("💡 Email confirmation required:");
          addLog("   1. Check email for confirmation link");
          addLog("   2. Or disable email confirmation in Supabase settings");
        }
      } else {
        addLog("✅ Direct Supabase login successful!");
        addLog(`👤 User ID: ${data.user?.id}`);
        addLog(`📧 Email: ${data.user?.email}`);
        addLog(`🔐 Session: ${data.session ? "Created" : "Not created"}`);

        if (data.session) {
          addLog(
            `🕒 Session expires: ${new Date(data.session.expires_at! * 1000).toISOString()}`
          );
        }
      }
    } catch (error) {
      addLog(`❌ Unexpected error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testAPILogin = async () => {
    setLoading(true);
    addLog("Testing API login endpoint...");

    try {
      addLog(`📧 Email: ${testEmail}`);
      addLog(`🔑 Password: ${"*".repeat(testPassword.length)}`);

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

      addLog(`📊 Response status: ${response.status}`);
      addLog(
        `📊 Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`
      );

      const data = await response.json();
      addLog(`📊 Response data: ${JSON.stringify(data, null, 2)}`);

      if (response.ok) {
        addLog("✅ API login successful!");
        addLog(`👤 User: ${data.user?.email}`);
        addLog(`🔐 Session: ${data.session ? "Created" : "Not created"}`);
      } else {
        addLog(`❌ API login failed: ${data.error}`);
      }
    } catch (error) {
      addLog(`❌ API login error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuthServiceLogin = async () => {
    setLoading(true);
    addLog("Testing authService.signIn...");

    try {
      addLog(`📧 Email: ${testEmail}`);
      addLog(`🔑 Password: ${"*".repeat(testPassword.length)}`);

      const result = await signIn(testEmail, testPassword);
      addLog("✅ AuthService login successful!");
      addLog(`📊 Result: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      addLog(`❌ AuthService login error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentSession = async () => {
    addLog("Checking current session...");

    try {
      if (!supabase) {
        addLog("❌ Supabase client not available");
        return;
      }

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        addLog(`❌ Session check error: ${error.message}`);
      } else {
        addLog(`📊 Session exists: ${data.session ? "Yes" : "No"}`);

        if (data.session) {
          addLog(`👤 User: ${data.session.user.email}`);
          addLog(
            `🕒 Expires: ${new Date(data.session.expires_at! * 1000).toISOString()}`
          );
        }
      }
    } catch (error) {
      addLog(`❌ Session check failed: ${error}`);
    }
  };

  const testUserExists = async () => {
    addLog("Checking if user exists in Supabase Auth...");

    try {
      // Try to trigger a password reset to see if user exists
      if (!supabase) {
        addLog("❌ Supabase client not available");
        return;
      }

      const { data, error } = await supabase.auth.resetPasswordForEmail(
        testEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        addLog(`❌ Password reset error: ${error.message}`);
        if (error.message.includes("User not found")) {
          addLog("💡 User does not exist in Supabase Auth");
          addLog("   You need to create this user first");
        }
      } else {
        addLog("✅ Password reset email sent (user exists)");
        addLog("💡 Check your email for the reset link");
      }
    } catch (error) {
      addLog(`❌ User existence check failed: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Email Login Debug
          </h1>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <h2 className="text-lg font-semibold text-blue-800 mb-4">
              Test Credentials
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="test@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Enter password"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={checkCurrentSession}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Check Current Session
              </button>

              <button
                onClick={testUserExists}
                disabled={loading || !testEmail}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                Check User Exists
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={testDirectSupabaseLogin}
                disabled={loading || !testEmail || !testPassword}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Testing..." : "Test Direct Supabase"}
              </button>

              <button
                onClick={testAPILogin}
                disabled={loading || !testEmail || !testPassword}
                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? "Testing..." : "Test API Login"}
              </button>

              <button
                onClick={testAuthServiceLogin}
                disabled={loading || !testEmail || !testPassword}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Testing..." : "Test AuthService"}
              </button>
            </div>

            <button
              onClick={clearLogs}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Clear Logs
            </button>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Debug Logs</h2>
            <div className="max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500">
                  No logs yet. Enter credentials and click test buttons above.
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
              Common Issues & Solutions
            </h3>
            <div className="text-sm text-yellow-700 space-y-2">
              <div>
                <strong>Invalid login credentials:</strong> User doesn't exist
                or wrong password
              </div>
              <div>
                <strong>Email not confirmed:</strong> Check email or disable
                confirmation in Supabase
              </div>
              <div>
                <strong>User not found:</strong> Create user account first via
                signup
              </div>
              <div>
                <strong>Session not persisting:</strong> Cookie/session
                synchronization issue
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
