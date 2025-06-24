"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function AuthDebug() {
  const { user } = useAuth();
  const [apiTest, setApiTest] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAuthAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/test-auth");
      const data = await response.json();
      setApiTest(data);
    } catch (error) {
      setApiTest({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testAuthAPI();
  }, []);

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-yellow-800 mb-2">
        Authentication Debug
      </h3>

      <div className="space-y-2 text-sm">
        <div>
          <strong>Auth Context User:</strong>{" "}
          {user ? "✅ Logged in" : "❌ Not logged in"}
        </div>

        {user && (
          <div className="ml-4 text-xs">
            <div>Email: {user.email}</div>
            <div>Role: {user.role}</div>
            <div>ID: {user.id}</div>
          </div>
        )}

        <div>
          <strong>API Test:</strong>
          <Button
            onClick={testAuthAPI}
            disabled={loading}
            size="sm"
            variant="outline"
            className="ml-2"
          >
            {loading ? "Testing..." : "Test API"}
          </Button>
        </div>

        {apiTest && (
          <div className="ml-4 text-xs bg-gray-100 p-2 rounded">
            <pre>{JSON.stringify(apiTest, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
