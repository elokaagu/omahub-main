"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface SessionDiagnostic {
  hasUser: boolean;
  hasSession: boolean;
  sessionValid: boolean;
  cookiesEnabled: boolean;
  apiTestPassed: boolean;
  userRole: string;
  sessionExpiry?: Date;
  errors: string[];
}

export default function SessionFixer() {
  const { user, session, refreshUserProfile } = useAuth();
  const [diagnostic, setDiagnostic] = useState<SessionDiagnostic | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const supabase = createClientComponentClient();

  const runDiagnostic = async (): Promise<SessionDiagnostic> => {
    const errors: string[] = [];

    // Check if cookies are enabled
    const cookiesEnabled = navigator.cookieEnabled;
    if (!cookiesEnabled) {
      errors.push("Cookies are disabled in your browser");
    }

    // Check user context
    const hasUser = !!user;
    if (!hasUser) {
      errors.push("No user found in authentication context");
    }

    // Check session
    const hasSession = !!session;
    if (!hasSession) {
      errors.push("No session found in authentication context");
    }

    // Validate session
    let sessionValid = false;
    let sessionExpiry: Date | undefined;
    try {
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();
      sessionValid = !!currentSession && !error;
      if (currentSession && currentSession.expires_at) {
        sessionExpiry = new Date(currentSession.expires_at * 1000);
        if (sessionExpiry < new Date()) {
          errors.push("Session has expired");
          sessionValid = false;
        }
      } else {
        errors.push("Unable to retrieve valid session from Supabase");
      }
    } catch (err) {
      errors.push("Error validating session: " + (err as Error).message);
    }

    // Test API call
    let apiTestPassed = false;
    try {
      const response = await fetch("/api/admin/leads?action=analytics", {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (response.ok) {
        apiTestPassed = true;
      } else {
        errors.push(
          `API test failed with status: ${response.status} ${response.statusText}`
        );
      }
    } catch (err) {
      errors.push("API test failed: " + (err as Error).message);
    }

    return {
      hasUser,
      hasSession,
      sessionValid,
      cookiesEnabled,
      apiTestPassed,
      userRole: user?.role || "unknown",
      sessionExpiry,
      errors,
    };
  };

  const handleRunDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    try {
      const result = await runDiagnostic();
      setDiagnostic(result);

      if (result.errors.length === 0) {
        toast.success("All authentication checks passed!");
      } else {
        toast.warning(`Found ${result.errors.length} authentication issues`);
      }
    } catch (error) {
      toast.error("Failed to run diagnostic");
      console.error("Diagnostic error:", error);
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  const fixAuthenticationSession = async () => {
    setIsFixing(true);
    try {
      console.log("🔧 Starting authentication session fix...");

      // Step 1: Clear any stale authentication data
      console.log("1️⃣ Clearing stale authentication data...");
      localStorage.removeItem("omahub-auth-token");
      sessionStorage.clear();

      // Step 2: Refresh the session
      console.log("2️⃣ Refreshing session...");
      const { data: refreshData, error: refreshError } =
        await supabase.auth.refreshSession();

      if (refreshError) {
        console.error("❌ Session refresh failed:", refreshError);

        // Step 3: If refresh fails, try to get a new session
        console.log(
          "3️⃣ Session refresh failed, attempting to get current session..."
        );
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !currentSession) {
          console.error(
            "❌ No valid session found, user needs to sign in again"
          );
          toast.error("Your session has expired. Please sign in again.");

          // Sign out and redirect to login
          await supabase.auth.signOut();
          window.location.href = "/login?expired=true";
          return;
        }
      }

      // Step 4: Refresh user profile
      console.log("4️⃣ Refreshing user profile...");
      await refreshUserProfile();

      // Step 5: Test the API again
      console.log("5️⃣ Testing API access...");
      const testResponse = await fetch("/api/admin/leads?action=analytics", {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (testResponse.ok) {
        console.log("✅ Authentication session fixed successfully!");
        toast.success("Authentication session fixed! Please refresh the page.");

        // Wait a bit then refresh the page
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        console.error("❌ API test still failing after fix");
        toast.error(
          "Authentication fix failed. You may need to sign out and sign in again."
        );
      }
    } catch (error) {
      console.error("❌ Error fixing authentication session:", error);
      toast.error("Failed to fix authentication session");
    } finally {
      setIsFixing(false);
    }
  };

  const forceSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      window.location.href = "/login";
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  // Auto-run diagnostic on mount
  useEffect(() => {
    handleRunDiagnostic();
  }, []);

  const getStatusIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getOverallStatus = () => {
    if (!diagnostic) return "unknown";
    if (diagnostic.errors.length === 0) return "healthy";
    if (diagnostic.apiTestPassed) return "warning";
    return "error";
  };

  const statusColors = {
    healthy: "bg-green-50 border-green-200",
    warning: "bg-yellow-50 border-yellow-200",
    error: "bg-red-50 border-red-200",
    unknown: "bg-gray-50 border-gray-200",
  };

  return (
    <Card className={`${statusColors[getOverallStatus()]} mb-6`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          🔧 Authentication Session Fixer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Diagnostic Results */}
        {diagnostic && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                {getStatusIcon(diagnostic.hasUser)}
                <span>
                  User Context: {diagnostic.hasUser ? "Found" : "Missing"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(diagnostic.hasSession)}
                <span>
                  Session: {diagnostic.hasSession ? "Active" : "Missing"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(diagnostic.sessionValid)}
                <span>
                  Session Valid: {diagnostic.sessionValid ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(diagnostic.cookiesEnabled)}
                <span>
                  Cookies: {diagnostic.cookiesEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(diagnostic.apiTestPassed)}
                <span>
                  API Access: {diagnostic.apiTestPassed ? "Working" : "Failed"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{diagnostic.userRole}</Badge>
                <span>User Role</span>
              </div>
            </div>

            {diagnostic.sessionExpiry && (
              <div className="text-xs text-gray-600">
                Session expires: {diagnostic.sessionExpiry.toLocaleString()}
              </div>
            )}

            {diagnostic.errors.length > 0 && (
              <div className="bg-white rounded p-3 border">
                <h4 className="font-semibold text-red-800 mb-2">
                  Issues Found:
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {diagnostic.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleRunDiagnostic}
            disabled={isRunningDiagnostic}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={`w-4 h-4 mr-1 ${isRunningDiagnostic ? "animate-spin" : ""}`}
            />
            {isRunningDiagnostic ? "Running..." : "Run Diagnostic"}
          </Button>

          {diagnostic && diagnostic.errors.length > 0 && (
            <Button
              onClick={fixAuthenticationSession}
              disabled={isFixing}
              size="sm"
            >
              {isFixing ? "Fixing..." : "Fix Authentication"}
            </Button>
          )}

          <Button onClick={forceSignOut} variant="destructive" size="sm">
            Sign Out & Restart
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-600 bg-white rounded p-3 border">
          <strong>💡 Quick Fixes:</strong>
          <ol className="mt-1 space-y-1 list-decimal list-inside">
            <li>Try the "Fix Authentication" button above</li>
            <li>Clear your browser cache and cookies for this site</li>
            <li>Disable browser extensions that might block cookies</li>
            <li>Use "Sign Out & Restart" to get a fresh session</li>
            <li>If issues persist, try an incognito/private window</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
