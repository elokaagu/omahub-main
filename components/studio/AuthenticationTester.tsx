"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  TestTube,
  Zap,
} from "lucide-react";
import { createClient, checkAuthState } from "@/lib/supabase-unified";

interface TestResult {
  test: string;
  status: "success" | "error" | "warning";
  message: string;
  details?: any;
  duration?: number;
}

export default function AuthenticationTester() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (result: TestResult) => {
    setResults((prev) => [...prev, result]);
  };

  const runComprehensiveTest = async () => {
    setTesting(true);
    setResults([]);

    const startTime = Date.now();

    try {
      // Test 1: Supabase Client Creation
      const test1Start = Date.now();
      addResult({
        test: "1. Client Creation",
        status: "success",
        message: "Creating unified Supabase client...",
      });

      const supabase = createClient();
      addResult({
        test: "1. Client Creation",
        status: "success",
        message: "✅ Unified client created successfully",
        duration: Date.now() - test1Start,
      });

      // Test 2: Session Check
      const test2Start = Date.now();
      addResult({
        test: "2. Session Validation",
        status: "success",
        message: "Checking current session state...",
      });

      const { session, error: sessionError } = await checkAuthState();

      if (sessionError) {
        addResult({
          test: "2. Session Validation",
          status: "error",
          message: `❌ Session validation failed: ${sessionError instanceof Error ? sessionError.message : "Unknown error"}`,
          details: sessionError,
          duration: Date.now() - test2Start,
        });
      } else if (!session) {
        addResult({
          test: "2. Session Validation",
          status: "warning",
          message: "⚠️ No active session found",
          duration: Date.now() - test2Start,
        });
      } else {
        addResult({
          test: "2. Session Validation",
          status: "success",
          message: `✅ Valid session for ${session.user.email}`,
          details: {
            userId: session.user.id,
            email: session.user.email,
            expiresAt: session.expires_at,
          },
          duration: Date.now() - test2Start,
        });

        // Test 3: Session Validation API
        const test3Start = Date.now();
        addResult({
          test: "3. API Session Check",
          status: "success",
          message: "Testing session validation API...",
        });

        try {
          const validationResponse = await fetch("/api/auth/validate", {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (validationResponse.ok) {
            const validationData = await validationResponse.json();
            addResult({
              test: "3. API Session Check",
              status: "success",
              message: `✅ API session validation successful`,
              details: validationData,
              duration: Date.now() - test3Start,
            });
          } else {
            const errorText = await validationResponse.text();
            addResult({
              test: "3. API Session Check",
              status: "error",
              message: `❌ API validation failed: ${validationResponse.status}`,
              details: errorText,
              duration: Date.now() - test3Start,
            });
          }
        } catch (apiError) {
          addResult({
            test: "3. API Session Check",
            status: "error",
            message: `❌ API validation error: ${apiError}`,
            duration: Date.now() - test3Start,
          });
        }

        // Test 4: Leads API with Credentials
        const test4Start = Date.now();
        addResult({
          test: "4. Leads API Test",
          status: "success",
          message: "Testing leads API with proper credentials...",
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
            addResult({
              test: "4. Leads API Test",
              status: "success",
              message: `✅ Leads API working - ${leadsData.total_leads || 0} total leads`,
              details: leadsData,
              duration: Date.now() - test4Start,
            });
          } else {
            const errorText = await leadsResponse.text();
            addResult({
              test: "4. Leads API Test",
              status: "error",
              message: `❌ Leads API failed: ${leadsResponse.status}`,
              details: errorText,
              duration: Date.now() - test4Start,
            });
          }
        } catch (apiError) {
          addResult({
            test: "4. Leads API Test",
            status: "error",
            message: `❌ Leads API error: ${apiError}`,
            duration: Date.now() - test4Start,
          });
        }

        // Test 5: Inbox API Test
        const test5Start = Date.now();
        addResult({
          test: "5. Inbox API Test",
          status: "success",
          message: "Testing inbox API with proper credentials...",
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
            addResult({
              test: "5. Inbox API Test",
              status: "success",
              message: `✅ Inbox API working - ${inboxData.totalInquiries || 0} total inquiries`,
              details: inboxData,
              duration: Date.now() - test5Start,
            });
          } else {
            const errorText = await inboxResponse.text();
            addResult({
              test: "5. Inbox API Test",
              status: "error",
              message: `❌ Inbox API failed: ${inboxResponse.status}`,
              details: errorText,
              duration: Date.now() - test5Start,
            });
          }
        } catch (apiError) {
          addResult({
            test: "5. Inbox API Test",
            status: "error",
            message: `❌ Inbox API error: ${apiError}`,
            duration: Date.now() - test5Start,
          });
        }

        // Test 6: Storage Keys Check
        const test6Start = Date.now();
        addResult({
          test: "6. Storage Analysis",
          status: "success",
          message: "Analyzing browser storage...",
        });

        if (typeof window !== "undefined") {
          const authKeys = [];
          const allKeys = [];

          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              allKeys.push(key);
              if (
                key.includes("supabase") ||
                key.includes("auth") ||
                key.includes("sb-")
              ) {
                authKeys.push(key);
              }
            }
          }

          addResult({
            test: "6. Storage Analysis",
            status: authKeys.length > 0 ? "success" : "warning",
            message: `Found ${authKeys.length} auth keys out of ${allKeys.length} total`,
            details: { authKeys, totalKeys: allKeys.length },
            duration: Date.now() - test6Start,
          });
        }
      }

      // Final Summary
      const totalDuration = Date.now() - startTime;
      const successCount = results.filter((r) => r.status === "success").length;
      const errorCount = results.filter((r) => r.status === "error").length;
      const warningCount = results.filter((r) => r.status === "warning").length;

      addResult({
        test: "🎯 Test Summary",
        status: errorCount === 0 ? "success" : "warning",
        message: `Completed: ${successCount} passed, ${warningCount} warnings, ${errorCount} errors`,
        details: {
          totalDuration: `${totalDuration}ms`,
          breakdown: { successCount, warningCount, errorCount },
        },
      });
    } catch (error) {
      addResult({
        test: "❌ Test Suite Error",
        status: "error",
        message: `Test suite failed: ${error}`,
      });
    }

    setTesting(false);
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
          <TestTube className="h-5 w-5" />
          Authentication System Tester
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={runComprehensiveTest}
            disabled={testing}
            className="flex items-center gap-2"
          >
            <Zap className={`h-4 w-4 ${testing ? "animate-spin" : ""}`} />
            {testing ? "Running Tests..." : "Run Full Test Suite"}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Test Results:</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.status === "success"
                      ? "bg-green-50 border-green-200"
                      : result.status === "error"
                        ? "bg-red-50 border-red-200"
                        : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{result.test}</div>
                        {result.duration && (
                          <div className="text-xs text-gray-500">
                            {result.duration}ms
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {result.message}
                      </div>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer">
                            Show details
                          </summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
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
            <strong>What this tests:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Unified Supabase client creation and configuration</li>
              <li>Session validation and state management</li>
              <li>API session validation endpoint</li>
              <li>Leads API with proper credentials</li>
              <li>Inbox API with proper credentials</li>
              <li>Browser storage and auth key analysis</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
