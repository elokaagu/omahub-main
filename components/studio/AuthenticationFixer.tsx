"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Shield,
  Trash2,
  LogOut,
  LogIn,
} from "lucide-react";
import { createClient } from "@/lib/supabase-unified";

interface AuthDiagnostic {
  step: string;
  status: "success" | "error" | "warning";
  message: string;
  details?: any;
}

export default function AuthenticationFixer() {
  const [diagnostics, setDiagnostics] = useState<AuthDiagnostic[]>([]);
  const [testing, setTesting] = useState(false);
  const [fixing, setFixing] = useState(false);
  const router = useRouter();

  const addDiagnostic = (diagnostic: AuthDiagnostic) => {
    setDiagnostics((prev) => [...prev, diagnostic]);
  };

  const runComprehensiveDiagnostic = async () => {
    setTesting(true);
    setDiagnostics([]);

    try {
      // Step 1: Check Supabase Client
      addDiagnostic({
        step: "1. Supabase Client",
        status: "success",
        message: "Creating Supabase client...",
      });

      const supabase = createClient();

      // Step 2: Check Current Session
      addDiagnostic({
        step: "2. Session Check",
        status: "success",
        message: "Checking current session...",
      });

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        addDiagnostic({
          step: "2. Session Check",
          status: "error",
          message: `Session error: ${sessionError.message}`,
          details: sessionError,
        });
      } else if (!session) {
        addDiagnostic({
          step: "2. Session Check",
          status: "warning",
          message: "No active session found",
        });
      } else {
        addDiagnostic({
          step: "2. Session Check",
          status: "success",
          message: `Session found for ${session.user.email}`,
          details: {
            userId: session.user.id,
            email: session.user.email,
            expiresAt: session.expires_at,
          },
        });

        // Step 3: Check User Profile
        addDiagnostic({
          step: "3. User Profile",
          status: "success",
          message: "Checking user profile...",
        });

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, owned_brands")
          .eq("id", session.user.id)
          .single();

        if (profileError) {
          addDiagnostic({
            step: "3. User Profile",
            status: "error",
            message: `Profile error: ${profileError.message}`,
            details: profileError,
          });
        } else {
          addDiagnostic({
            step: "3. User Profile",
            status: "success",
            message: `Profile found - Role: ${profile.role}`,
            details: profile,
          });
        }

        // Step 4: Test Leads API
        addDiagnostic({
          step: "4. Leads API Test",
          status: "success",
          message: "Testing leads API access...",
        });

        try {
          const leadsResponse = await fetch(
            "/api/admin/leads?action=analytics",
            {
              method: "GET",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (leadsResponse.ok) {
            const leadsData = await leadsResponse.json();
            addDiagnostic({
              step: "4. Leads API Test",
              status: "success",
              message: `Leads API working - ${leadsData.total_leads || 0} total leads`,
              details: leadsData,
            });
          } else {
            const errorText = await leadsResponse.text();
            addDiagnostic({
              step: "4. Leads API Test",
              status: "error",
              message: `Leads API failed: ${leadsResponse.status} ${errorText}`,
            });
          }
        } catch (apiError) {
          addDiagnostic({
            step: "4. Leads API Test",
            status: "error",
            message: `Leads API error: ${apiError}`,
          });
        }

        // Step 5: Test Inbox API
        addDiagnostic({
          step: "5. Inbox API Test",
          status: "success",
          message: "Testing inbox API access...",
        });

        try {
          const inboxResponse = await fetch("/api/studio/inbox/stats", {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (inboxResponse.ok) {
            const inboxData = await inboxResponse.json();
            addDiagnostic({
              step: "5. Inbox API Test",
              status: "success",
              message: `Inbox API working - ${inboxData.totalInquiries || 0} total inquiries`,
              details: inboxData,
            });
          } else {
            const errorText = await inboxResponse.text();
            addDiagnostic({
              step: "5. Inbox API Test",
              status: "error",
              message: `Inbox API failed: ${inboxResponse.status} ${errorText}`,
            });
          }
        } catch (apiError) {
          addDiagnostic({
            step: "5. Inbox API Test",
            status: "error",
            message: `Inbox API error: ${apiError}`,
          });
        }
      }

      // Step 6: Check Browser Storage
      addDiagnostic({
        step: "6. Browser Storage",
        status: "success",
        message: "Checking browser storage...",
      });

      if (typeof window !== "undefined") {
        const authKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes("supabase") || key.includes("auth"))) {
            authKeys.push(key);
          }
        }

        addDiagnostic({
          step: "6. Browser Storage",
          status: authKeys.length > 0 ? "success" : "warning",
          message: `Found ${authKeys.length} auth-related storage keys`,
          details: authKeys,
        });
      }
    } catch (error) {
      addDiagnostic({
        step: "Diagnostic Error",
        status: "error",
        message: `Diagnostic failed: ${error}`,
      });
    }

    setTesting(false);
  };

  const fixAuthentication = async () => {
    setFixing(true);
    setDiagnostics([]);

    try {
      addDiagnostic({
        step: "Fix 1. Clear Storage",
        status: "success",
        message: "Clearing corrupted auth data...",
      });

      // Clear all auth-related storage
      if (typeof window !== "undefined") {
        const keysToRemove = [
          "sb-auth-token",
          "omahub-auth-token",
          "supabase.auth.token",
          "sb-localhost-auth-token",
        ];

        keysToRemove.forEach((key) => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });

        // Clear cookies
        document.cookie.split(";").forEach((cookie) => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          if (name.trim().includes("sb-") || name.trim().includes("auth")) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          }
        });
      }

      addDiagnostic({
        step: "Fix 2. Sign Out",
        status: "success",
        message: "Signing out completely...",
      });

      const supabase = createClient();
      await supabase.auth.signOut();

      addDiagnostic({
        step: "Fix 3. Final Cleanup",
        status: "success",
        message: "Final cleanup...",
      });

      // Wait for cleanup
      await new Promise((resolve) => setTimeout(resolve, 1000));

      addDiagnostic({
        step: "Fix Complete",
        status: "success",
        message: "Authentication fixed! Redirecting to login...",
      });

      // Redirect to login
      setTimeout(() => {
        router.push("/login?message=Please sign in again");
      }, 2000);
    } catch (error) {
      addDiagnostic({
        step: "Fix Error",
        status: "error",
        message: `Fix failed: ${error}`,
      });
    }

    setFixing(false);
  };

  const refreshSession = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.refreshSession();

      if (error) {
        addDiagnostic({
          step: "Session Refresh",
          status: "error",
          message: `Refresh failed: ${error.message}`,
        });
      } else {
        addDiagnostic({
          step: "Session Refresh",
          status: "success",
          message: "Session refreshed successfully",
        });
        // Re-run diagnostic
        setTimeout(runComprehensiveDiagnostic, 1000);
      }
    } catch (error) {
      addDiagnostic({
        step: "Session Refresh",
        status: "error",
        message: `Refresh error: ${error}`,
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Authentication System Fixer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={runComprehensiveDiagnostic}
            disabled={testing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${testing ? "animate-spin" : ""}`} />
            {testing ? "Running Diagnostic..." : "Run Full Diagnostic"}
          </Button>

          <Button
            onClick={refreshSession}
            disabled={testing || fixing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Session
          </Button>

          <Button
            onClick={fixAuthentication}
            disabled={testing || fixing}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Trash2 className={`h-4 w-4 ${fixing ? "animate-spin" : ""}`} />
            {fixing ? "Fixing..." : "Fix Authentication"}
          </Button>
        </div>

        {diagnostics.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Diagnostic Results:</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {diagnostics.map((diagnostic, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    diagnostic.status === "success"
                      ? "bg-green-50 border-green-200"
                      : diagnostic.status === "error"
                        ? "bg-red-50 border-red-200"
                        : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {getStatusIcon(diagnostic.status)}
                    <div className="flex-1">
                      <div className="font-medium">{diagnostic.step}</div>
                      <div className="text-sm text-gray-600">
                        {diagnostic.message}
                      </div>
                      {diagnostic.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer">
                            Show details
                          </summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(diagnostic.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>How to use this tool:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>
                <strong>Run Full Diagnostic</strong> - Check all authentication
                components
              </li>
              <li>
                <strong>Refresh Session</strong> - Try to refresh your current
                session
              </li>
              <li>
                <strong>Fix Authentication</strong> - Clear all auth data and
                force re-login
              </li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
