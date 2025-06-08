"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import GoogleOAuthButton from "@/components/auth/GoogleOAuthButton";

export default function DebugOAuthPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [supabaseConfig, setSupabaseConfig] = useState<any>({});

  // Email/password test state
  const [testEmail, setTestEmail] = useState("testuser@gmail.com");
  const [testPassword, setTestPassword] = useState("testpassword123");
  const [emailLoading, setEmailLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs((prev) => [logMessage, ...prev]);
    console.log(logMessage);
  };

  useEffect(() => {
    checkCurrentSession();
    checkSupabaseConfig();
  }, []);

  const checkSupabaseConfig = async () => {
    addLog("🔍 Checking Supabase configuration...");

    const config = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      environment: process.env.NODE_ENV,
      currentOrigin:
        typeof window !== "undefined" ? window.location.origin : "unknown",
    };

    setSupabaseConfig(config);
    addLog(`📋 Supabase URL: ${config.url}`);
    addLog(`📋 Has Anon Key: ${config.hasAnonKey}`);
    addLog(`📋 Environment: ${config.environment}`);
    addLog(`📋 Current Origin: ${config.currentOrigin}`);
  };

  const checkCurrentSession = async () => {
    addLog("🔍 Checking current session...");
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        addLog(`❌ Session check error: ${error.message}`);
      } else if (session) {
        setSession(session);
        addLog(`✅ Active session found: ${session.user.email}`);
        addLog(
          `🔐 Provider: ${session.user.app_metadata?.provider || "email"}`
        );
      } else {
        addLog("ℹ️ No active session");
        setSession(null);
      }
    } catch (err) {
      addLog(`❌ Session check failed: ${err}`);
    }
  };

  const testEmailPasswordLogin = async () => {
    setEmailLoading(true);
    addLog("🧪 Testing email/password login...");
    addLog(`📧 Email: ${testEmail}`);
    addLog(`🔑 Password: ${testPassword.replace(/./g, "*")}`);

    try {
      // Test the login API endpoint
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

      if (response.ok) {
        addLog("✅ Email/password login successful!");
        addLog(`👤 User ID: ${data.user?.id}`);
        addLog(`📧 Email: ${data.user?.email}`);
        addLog(`🔐 Session created: ${!!data.session}`);

        // Refresh session check
        await checkCurrentSession();
      } else {
        addLog(`❌ Email/password login failed: ${data.error}`);

        if (data.error === "Invalid login credentials") {
          addLog("💡 This means:");
          addLog("   1. User doesn't exist in Supabase Auth");
          addLog("   2. Password is incorrect");
          addLog("   3. Email is incorrect");
          addLog("📝 To test email/password login:");
          addLog("   1. Go to Supabase Dashboard > Authentication > Users");
          addLog("   2. Create a test user manually, or");
          addLog("   3. Use the signup form to create a user first");
        } else if (data.error === "Email not confirmed") {
          addLog("💡 Email confirmation required:");
          addLog("   1. Check your email for confirmation link");
          addLog("   2. Click the confirmation link to verify email");
          addLog("   3. Or disable email confirmation in Supabase Dashboard");
          addLog("   4. Go to Authentication > Settings > Email Auth");
          addLog("   5. Turn off 'Enable email confirmations'");
        } else if (data.error.includes("signup")) {
          addLog("💡 Signup may be disabled or restricted");
        }
      }
    } catch (error) {
      addLog(`❌ Email/password test error: ${error}`);
    } finally {
      setEmailLoading(false);
    }
  };

  const testSignup = async () => {
    setEmailLoading(true);
    addLog("🧪 Testing email/password signup...");
    addLog(`📧 Email: ${testEmail}`);
    addLog(`🔑 Password: ${testPassword.replace(/./g, "*")}`);

    try {
      // Test the signup API endpoint
      const response = await fetch("/api/auth/signup", {
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

      if (response.ok) {
        addLog("✅ Email/password signup successful!");
        addLog(`👤 User ID: ${data.user?.id}`);
        addLog(`📧 Email: ${data.user?.email}`);
        addLog(`🔐 Session created: ${!!data.session}`);
        addLog(`📝 Message: ${data.message}`);

        if (data.user && !data.session) {
          addLog("📧 Check your email for confirmation link");
        }

        // Refresh session check
        await checkCurrentSession();
      } else {
        addLog(`❌ Email/password signup failed: ${data.error}`);

        if (data.error.includes("already registered")) {
          addLog("💡 User already exists - you can try logging in instead");
        } else if (data.error.includes("Password")) {
          addLog("💡 Password requirements not met");
        }
      }
    } catch (error) {
      addLog(`❌ Signup test error: ${error}`);
    } finally {
      setEmailLoading(false);
    }
  };

  const testGoogleOAuthProvider = async () => {
    setLoading(true);
    addLog("🧪 Testing Google OAuth provider configuration...");

    try {
      // Test if Google provider is available by attempting to get OAuth URL
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true, // Don't redirect, just test config
        },
      });

      if (error) {
        addLog(`❌ Google OAuth provider test failed: ${error.message}`);

        if (error.message.includes("Provider not found")) {
          addLog("💡 Google OAuth provider is NOT configured in Supabase");
          addLog("📝 To configure Google OAuth:");
          addLog("   1. Go to Supabase Dashboard > Authentication > Providers");
          addLog("   2. Find 'Google' and click to configure");
          addLog("   3. Enable the provider");
          addLog("   4. Add your Google Client ID and Client Secret");
          addLog("   5. Save the configuration");
        } else if (error.message.includes("Invalid client")) {
          addLog("💡 Google OAuth is configured but credentials are invalid");
          addLog("📝 Check your Google OAuth credentials:");
          addLog("   1. Verify Client ID and Secret in Supabase Dashboard");
          addLog("   2. Check redirect URIs in Google Cloud Console");
        } else {
          addLog(`💡 Other OAuth error: ${error.message}`);
        }
      } else {
        addLog("✅ Google OAuth provider is properly configured!");
        if (data?.url) {
          addLog(`🔗 OAuth URL generated successfully`);
          addLog(
            `📋 URL has state: ${data.url.includes("state=") ? "Yes" : "No"}`
          );
          addLog(
            `📋 URL has code_challenge: ${data.url.includes("code_challenge=") ? "Yes" : "No"}`
          );
          addLog(
            `📋 URL has redirect_uri: ${data.url.includes("redirect_uri=") ? "Yes" : "No"}`
          );

          // Extract some URL details
          const url = new URL(data.url);
          addLog(`📋 OAuth domain: ${url.hostname}`);
          addLog(
            `📋 Client ID present: ${url.searchParams.has("client_id") ? "Yes" : "No"}`
          );
        }
      }
    } catch (err) {
      addLog(`❌ OAuth provider test error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const testOAuthConfig = async () => {
    setLoading(true);
    addLog("🧪 Testing OAuth configuration...");

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true, // Don't redirect, just test config
        },
      });

      if (error) {
        addLog(`❌ OAuth config test failed: ${error.message}`);

        if (error.message.includes("Provider not found")) {
          addLog(
            "💡 Solution: Configure Google OAuth provider in Supabase Dashboard"
          );
          addLog("   1. Go to Authentication > Providers");
          addLog("   2. Enable Google provider");
          addLog("   3. Add your Google OAuth credentials");
        } else if (error.message.includes("Invalid client")) {
          addLog("💡 Solution: Check Google OAuth client configuration");
          addLog("   1. Verify Client ID and Secret in Supabase");
          addLog("   2. Check redirect URIs in Google Cloud Console");
        }
      } else {
        addLog("✅ OAuth configuration looks good!");
        if (data?.url) {
          addLog(
            `🔗 OAuth URL would be generated: ${data.url.substring(0, 50)}...`
          );
          addLog(
            `📋 URL has state: ${data.url.includes("state=") ? "Yes" : "No"}`
          );
          addLog(
            `📋 URL has code_challenge: ${data.url.includes("code_challenge=") ? "Yes" : "No"}`
          );
        }
      }
    } catch (err) {
      addLog(`❌ OAuth test error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const clearSession = async () => {
    addLog("🧹 Clearing session...");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        addLog(`❌ Sign out error: ${error.message}`);
      } else {
        addLog("✅ Session cleared successfully");
        setSession(null);
      }
    } catch (err) {
      addLog(`❌ Clear session error: ${err}`);
    }
  };

  const testCallback = () => {
    addLog("🔗 Testing callback URL...");
    const callbackUrl = `${window.location.origin}/auth/callback`;
    addLog(`📋 Callback URL: ${callbackUrl}`);

    // Test if callback endpoint is accessible
    fetch(callbackUrl, { method: "GET" })
      .then((response) => {
        if (response.ok || response.status === 400) {
          addLog("✅ Callback endpoint is accessible");
        } else {
          addLog(`⚠️ Callback endpoint returned: ${response.status}`);
        }
      })
      .catch((err) => {
        addLog(`❌ Callback endpoint test failed: ${err.message}`);
      });
  };

  const testPKCEFlow = async () => {
    addLog("🔐 Testing PKCE flow specifically...");

    try {
      // Clear all auth state first
      addLog("🧹 Clearing all auth state...");
      await supabase.auth.signOut();

      // Clear localStorage and sessionStorage
      if (typeof window !== "undefined") {
        const authKeys = Object.keys(localStorage).filter(
          (key) => key.includes("supabase") || key.includes("auth")
        );
        authKeys.forEach((key) => {
          localStorage.removeItem(key);
          addLog(`🗑️ Cleared localStorage: ${key}`);
        });

        const sessionKeys = Object.keys(sessionStorage).filter(
          (key) => key.includes("supabase") || key.includes("auth")
        );
        sessionKeys.forEach((key) => {
          sessionStorage.removeItem(key);
          addLog(`🗑️ Cleared sessionStorage: ${key}`);
        });
      }

      addLog("🔄 Testing PKCE OAuth flow...");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        addLog(`❌ PKCE OAuth test failed: ${error.message}`);
      } else {
        addLog("✅ PKCE OAuth configuration successful");
        if (data?.url) {
          addLog("🔗 PKCE-enabled OAuth URL generated");
          addLog(
            `📋 URL contains state: ${data.url.includes("state=") ? "Yes" : "No"}`
          );
          addLog(
            `📋 URL contains code_challenge: ${data.url.includes("code_challenge=") ? "Yes" : "No"}`
          );
          addLog(
            `📋 URL contains code_challenge_method: ${data.url.includes("code_challenge_method=") ? "Yes" : "No"}`
          );
        }
      }
    } catch (err) {
      addLog(`❌ PKCE test error: ${err}`);
    }
  };

  const testProductionAuth = async () => {
    addLog("🌐 Testing production authentication environment...");

    try {
      // Test environment variables
      addLog("🔍 Checking environment configuration...");
      addLog(
        `📋 Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing"}`
      );
      addLog(
        `📋 Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing"}`
      );
      addLog(`📋 Environment: ${process.env.NODE_ENV}`);

      // Test Supabase connection
      addLog("🔗 Testing Supabase connection...");
      const { data: healthCheck, error: healthError } = await supabase
        .from("profiles")
        .select("count")
        .limit(1);

      if (healthError) {
        addLog(`❌ Supabase connection failed: ${healthError.message}`);
      } else {
        addLog("✅ Supabase connection successful");
      }

      // Test auth configuration
      addLog("🔐 Testing auth configuration...");
      const { data: authData, error: authError } =
        await supabase.auth.getSession();

      if (authError) {
        addLog(`❌ Auth configuration error: ${authError.message}`);
      } else {
        addLog("✅ Auth configuration working");
      }

      // Test API endpoints
      addLog("🌐 Testing API endpoints...");

      // Test login endpoint
      try {
        const loginResponse = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@test.com", password: "test" }),
        });

        if (loginResponse.status === 401) {
          addLog(
            "✅ Login API endpoint is accessible (returned 401 as expected)"
          );
        } else {
          addLog(`⚠️ Login API endpoint returned: ${loginResponse.status}`);
        }
      } catch (err) {
        addLog(`❌ Login API endpoint error: ${err}`);
      }

      // Test signup endpoint
      try {
        const signupResponse = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@test.com", password: "test" }),
        });

        if (signupResponse.status === 400 || signupResponse.status === 201) {
          addLog("✅ Signup API endpoint is accessible");
        } else {
          addLog(`⚠️ Signup API endpoint returned: ${signupResponse.status}`);
        }
      } catch (err) {
        addLog(`❌ Signup API endpoint error: ${err}`);
      }

      addLog("📝 Production test complete. Check logs above for issues.");
    } catch (error) {
      addLog(`❌ Production test error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🐛 OAuth Debug Console
          </h1>

          {/* Supabase Configuration */}
          <div className="mb-8 p-6 bg-purple-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              ⚙️ Supabase Configuration
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Supabase URL:</strong>
                <span
                  className={`ml-2 ${supabaseConfig.url ? "text-green-600" : "text-red-600"}`}
                >
                  {supabaseConfig.url || "Missing"}
                </span>
              </div>
              <div>
                <strong>Has Anon Key:</strong>
                <span
                  className={`ml-2 ${supabaseConfig.hasAnonKey ? "text-green-600" : "text-red-600"}`}
                >
                  {supabaseConfig.hasAnonKey ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <strong>Environment:</strong>
                <span className="ml-2 text-blue-600">
                  {supabaseConfig.environment}
                </span>
              </div>
              <div>
                <strong>Current Origin:</strong>
                <span className="ml-2 text-blue-600">
                  {supabaseConfig.currentOrigin}
                </span>
              </div>
            </div>
          </div>

          {/* Current Session Status */}
          <div className="mb-8 p-6 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">📊 Current Session</h2>
            {session ? (
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Status:</strong>{" "}
                  <span className="text-green-600">✅ Authenticated</span>
                </div>
                <div>
                  <strong>Email:</strong> {session.user.email}
                </div>
                <div>
                  <strong>Provider:</strong>{" "}
                  {session.user.app_metadata?.provider || "email"}
                </div>
                <div>
                  <strong>User ID:</strong> {session.user.id}
                </div>
                <div>
                  <strong>Access Token:</strong>{" "}
                  {session.access_token ? "Present" : "Missing"}
                </div>
                <div>
                  <strong>Refresh Token:</strong>{" "}
                  {session.refresh_token ? "Present" : "Missing"}
                </div>
              </div>
            ) : (
              <div className="text-gray-600">
                <span className="text-orange-600">⚠️ No active session</span>
              </div>
            )}
          </div>

          {/* Email/Password Test */}
          <div className="mb-8 p-6 bg-green-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              📧 Email/Password Test
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Email
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
                    Test Password
                  </label>
                  <input
                    type="password"
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="testpassword123"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={testSignup}
                  disabled={emailLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {emailLoading ? "Testing..." : "Test Signup"}
                </button>
                <button
                  onClick={testEmailPasswordLogin}
                  disabled={emailLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {emailLoading ? "Testing..." : "Test Login"}
                </button>
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="mb-8 space-y-4">
            <h2 className="text-xl font-semibold mb-4">🧪 OAuth Tests</h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={checkCurrentSession}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Check Session
              </button>
              <button
                onClick={testGoogleOAuthProvider}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Testing..." : "Test Google Provider"}
              </button>
              <button
                onClick={testOAuthConfig}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Testing..." : "Test OAuth Config"}
              </button>
              <button
                onClick={testPKCEFlow}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? "Testing..." : "Test PKCE Flow"}
              </button>
              <button
                onClick={testCallback}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Test Callback URL
              </button>
              <button
                onClick={clearSession}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Clear Session
              </button>
              <button
                onClick={() => setLogs([])}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Clear Logs
              </button>
              <button
                onClick={testProductionAuth}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
              >
                Test Production Auth
              </button>
            </div>
          </div>

          {/* OAuth Button Test */}
          <div className="mb-8 p-6 bg-yellow-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">🔐 Live OAuth Test</h2>
            <p className="text-gray-600 mb-4">
              This will attempt the actual OAuth flow. Check the logs below for
              detailed information.
            </p>
            <div className="max-w-sm">
              <GoogleOAuthButton redirectTo="/debug-oauth" />
            </div>
          </div>

          {/* Environment Info */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">🔧 Environment</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Current URL:</strong>{" "}
                {typeof window !== "undefined"
                  ? window.location.origin
                  : "Unknown"}
              </div>
              <div>
                <strong>Callback URL:</strong>{" "}
                {typeof window !== "undefined"
                  ? `${window.location.origin}/auth/callback`
                  : "Unknown"}
              </div>
              <div>
                <strong>Success URL:</strong>{" "}
                {typeof window !== "undefined"
                  ? `${window.location.origin}/auth/success`
                  : "Unknown"}
              </div>
              <div>
                <strong>Supabase URL:</strong>{" "}
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing"}
              </div>
            </div>
          </div>

          {/* Logs */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">📋 Debug Logs</h2>
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

          {/* Quick Setup Guide */}
          <div className="p-6 bg-red-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              🚀 Quick Setup Checklist
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                ☐ <strong>Google Cloud Console:</strong> Create OAuth 2.0
                credentials
              </div>
              <div>
                ☐ <strong>Redirect URIs:</strong> Add
                http://localhost:3000/auth/callback
              </div>
              <div>
                ☐ <strong>Supabase Dashboard:</strong> Enable Google provider
              </div>
              <div>
                ☐ <strong>Supabase Config:</strong> Add Google Client ID and
                Secret
              </div>
              <div>
                ☐ <strong>Environment:</strong> Add NEXT_PUBLIC_GOOGLE_CLIENT_ID
                (optional)
              </div>
              <div>
                ☐ <strong>Test:</strong> Use "Test Google Provider" button above
              </div>
              <div>
                ☐ <strong>Email/Password:</strong> Create test user or use
                signup test
              </div>
            </div>
          </div>

          {/* Email Confirmation Troubleshooting */}
          <div className="mb-8 p-6 bg-orange-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              📧 Email Confirmation Troubleshooting
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <strong>Common Issues on Deployed Version:</strong>
              </div>
              <div className="ml-4 space-y-2">
                <div>
                  ✅ <strong>Email Confirmation Required:</strong> Most likely
                  cause
                  <ul className="ml-6 mt-1 space-y-1 text-xs">
                    <li>
                      • Users must click email confirmation link before login
                    </li>
                    <li>• Check spam/junk folder for confirmation email</li>
                    <li>
                      • Error: "Email not confirmed" or "Invalid login
                      credentials"
                    </li>
                  </ul>
                </div>
                <div>
                  ⚙️ <strong>Disable Email Confirmation (for testing):</strong>
                  <ul className="ml-6 mt-1 space-y-1 text-xs">
                    <li>
                      • Go to Supabase Dashboard → Authentication → Settings
                    </li>
                    <li>• Find "Email Auth" section</li>
                    <li>• Turn OFF "Enable email confirmations"</li>
                    <li>• Save settings and test again</li>
                  </ul>
                </div>
                <div>
                  🔧 <strong>Environment Variables:</strong>
                  <ul className="ml-6 mt-1 space-y-1 text-xs">
                    <li>
                      • Verify NEXT_PUBLIC_SUPABASE_URL is set in production
                    </li>
                    <li>
                      • Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is set in
                      production
                    </li>
                    <li>• Check deployment platform environment variables</li>
                  </ul>
                </div>
                <div>
                  👤 <strong>User Account Issues:</strong>
                  <ul className="ml-6 mt-1 space-y-1 text-xs">
                    <li>• User might not exist in production database</li>
                    <li>• Use signup first to create account</li>
                    <li>• Check Supabase Dashboard → Authentication → Users</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-3 bg-orange-100 rounded">
                <strong>Quick Fix for Testing:</strong>
                <ol className="ml-4 mt-2 space-y-1 text-xs">
                  <li>1. Go to your Supabase Dashboard</li>
                  <li>2. Authentication → Settings → Email Auth</li>
                  <li>3. Disable "Enable email confirmations"</li>
                  <li>4. Try login again</li>
                  <li>5. Re-enable email confirmations after testing</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
