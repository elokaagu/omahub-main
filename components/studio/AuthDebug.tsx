"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AuthDebug() {
  const { user } = useAuth();
  const [apiTest, setApiTest] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  const testApiCall = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/leads?action=analytics", {
        credentials: "include",
      });
      const data = await response.json();

      setApiTest({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: data,
        ok: response.ok,
      });
    } catch (error) {
      setApiTest({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const [sessionInfo, setSessionInfo] = useState<any>(null);

  useEffect(() => {
    const getSessionInfo = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      setSessionInfo({ session, error });
    };
    getSessionInfo();
  }, [supabase]);

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800">🔍 Authentication Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Info */}
        <div>
          <h4 className="font-semibold text-blue-800">User Context:</h4>
          <div className="text-sm">
            {user ? (
              <div className="space-y-1">
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Role:</strong>{" "}
                  <Badge variant="outline">{user.role}</Badge>
                </p>
                <p>
                  <strong>ID:</strong> {user.id}
                </p>
                <p>
                  <strong>Owned Brands:</strong>{" "}
                  {JSON.stringify(user.owned_brands)}
                </p>
              </div>
            ) : (
              <p className="text-red-600">❌ No user found in context</p>
            )}
          </div>
        </div>

        {/* Session Info */}
        <div>
          <h4 className="font-semibold text-blue-800">Session Info:</h4>
          <div className="text-sm">
            {sessionInfo?.session ? (
              <div className="space-y-1">
                <p>
                  <strong>Session:</strong> ✅ Active
                </p>
                <p>
                  <strong>User ID:</strong> {sessionInfo.session.user.id}
                </p>
                <p>
                  <strong>Email:</strong> {sessionInfo.session.user.email}
                </p>
                <p>
                  <strong>Expires:</strong>{" "}
                  {new Date(
                    sessionInfo.session.expires_at * 1000
                  ).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-red-600">❌ No active session</p>
            )}
          </div>
        </div>

        {/* API Test */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-blue-800">API Test:</h4>
            <Button
              onClick={testApiCall}
              disabled={loading}
              size="sm"
              variant="outline"
            >
              {loading ? "Testing..." : "Test API Call"}
            </Button>
          </div>
          {apiTest && (
            <div className="text-sm bg-white p-3 rounded border">
              <p>
                <strong>Status:</strong>{" "}
                <Badge variant={apiTest.ok ? "default" : "destructive"}>
                  {apiTest.status}
                </Badge>
              </p>
              {apiTest.error ? (
                <p className="text-red-600">
                  <strong>Error:</strong> {apiTest.error}
                </p>
              ) : (
                <div className="space-y-1">
                  <p>
                    <strong>Response:</strong>{" "}
                    {apiTest.ok ? "✅ Success" : "❌ Failed"}
                  </p>
                  <details>
                    <summary className="cursor-pointer">View Details</summary>
                    <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(apiTest, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
