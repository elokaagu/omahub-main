"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  createClient,
  clearAuthData,
  checkAuthState,
} from "@/lib/supabase-unified";

interface AuthStatus {
  hasSession: boolean;
  sessionValid: boolean;
  cookiesValid: boolean;
  apiAccess: boolean;
  userRole: string | null;
  errors: string[];
}

export default function AuthFixer() {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const router = useRouter();

  const checkAuthStatus = async () => {
    setLoading(true);
    const errors: string[] = [];
    let hasSession = false;
    let sessionValid = false;
    let cookiesValid = true;
    let apiAccess = false;
    let userRole: string | null = null;

    try {
      // 1. Check session state
      const { session, error } = await checkAuthState();

      if (error) {
        errors.push(
          `Session error: ${error instanceof Error ? error.message : String(error)}`
        );
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("Failed to parse cookie")) {
          cookiesValid = false;
          errors.push("Corrupted authentication cookies detected");
        }
      }

      if (session) {
        hasSession = true;
        sessionValid = true;

        // 2. Test API access
        try {
          const response = await fetch("/api/admin/leads?action=analytics", {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            apiAccess = true;
            const data = await response.json();
            console.log("API test successful:", data);
          } else {
            errors.push(
              `API access failed: ${response.status} ${response.statusText}`
            );

            if (response.status === 401) {
              errors.push("Authentication failed - session may be invalid");
            } else if (response.status === 403) {
              errors.push("Access denied - insufficient permissions");
            }
          }
        } catch (apiError) {
          errors.push(`API test failed: ${apiError}`);
        }

        // 3. Check user role
        try {
          const supabase = createClient();
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          userRole = profile?.role || null;
          if (!userRole) {
            errors.push("User profile/role not found");
          }
        } catch (profileError) {
          errors.push(`Profile check failed: ${profileError}`);
        }
      } else {
        errors.push("No active session found");
      }
    } catch (error) {
      errors.push(`Auth check failed: ${error}`);
    }

    setStatus({
      hasSession,
      sessionValid,
      cookiesValid,
      apiAccess,
      userRole,
      errors,
    });
    setLoading(false);
  };

  const fixAuthentication = async () => {
    setFixing(true);

    try {
      // 1. Clear corrupted auth data
      console.log("🧹 Clearing corrupted auth data...");
      clearAuthData();

      // 2. Wait a moment for cleanup
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 3. Sign out completely
      console.log("🚪 Signing out...");
      const supabase = createClient();
      await supabase.auth.signOut();

      // 4. Clear browser storage again
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }

      // 5. Redirect to login
      console.log("🔄 Redirecting to login...");
      router.push("/login?message=Authentication fixed, please sign in again");
    } catch (error) {
      console.error("Fix failed:", error);
      alert(
        "Fix failed. Please manually clear your browser data and try again."
      );
    } finally {
      setFixing(false);
    }
  };

  const refreshSession = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.refreshSession();

      if (error) {
        throw error;
      }

      // Recheck status
      await checkAuthStatus();
    } catch (error) {
      console.error("Session refresh failed:", error);
      alert("Session refresh failed. You may need to sign in again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  if (!status) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Checking Authentication Status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const getStatusIcon = (isGood: boolean) => {
    return isGood ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const overallStatus =
    status.hasSession &&
    status.sessionValid &&
    status.cookiesValid &&
    status.apiAccess;

  return (
    <div className="w-full max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {overallStatus ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )}
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Checks */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.hasSession)}
              <span>Session Active</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.sessionValid)}
              <span>Session Valid</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.cookiesValid)}
              <span>Cookies Valid</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.apiAccess)}
              <span>API Access</span>
            </div>
          </div>

          {/* User Role */}
          {status.userRole && (
            <div className="flex items-center gap-2">
              <span>Role:</span>
              <Badge
                variant={
                  status.userRole === "super_admin" ? "default" : "secondary"
                }
              >
                {status.userRole}
              </Badge>
            </div>
          )}

          {/* Errors */}
          {status.errors.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <strong>Issues Found:</strong>
                  <ul className="list-disc list-inside space-y-1">
                    {status.errors.map((error, index) => (
                      <li key={index} className="text-sm">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={checkAuthStatus}
              disabled={loading}
              variant="outline"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Recheck Status
            </Button>

            {status.hasSession && !status.apiAccess && (
              <Button
                onClick={refreshSession}
                disabled={loading}
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Session
              </Button>
            )}

            {(!status.cookiesValid || status.errors.length > 0) && (
              <Button
                onClick={fixAuthentication}
                disabled={fixing}
                variant="destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {fixing ? "Fixing..." : "Fix Authentication"}
              </Button>
            )}
          </div>

          {/* Instructions */}
          {!overallStatus && (
            <Alert>
              <AlertDescription>
                <strong>Troubleshooting Steps:</strong>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>
                    Try "Refresh Session" first if you have an active session
                  </li>
                  <li>
                    If cookies are corrupted, use "Fix Authentication" (will
                    sign you out)
                  </li>
                  <li>
                    Clear your browser cache and cookies manually if issues
                    persist
                  </li>
                  <li>
                    Try signing in from an incognito/private browser window
                  </li>
                </ol>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
