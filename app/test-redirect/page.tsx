"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TestRedirectPage() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    // Test if we arrived here from a redirect
    const urlParams = new URLSearchParams(window.location.search);
    const fromRedirect = urlParams.get("from_redirect");

    if (fromRedirect) {
      setTestResults((prev) => [
        ...prev,
        `✅ Successfully redirected from: ${fromRedirect}`,
      ]);
    }
  }, []);

  const addTestResult = (result: string) => {
    setTestResults((prev) => [...prev, result]);
  };

  const testLoginRedirect = () => {
    addTestResult("🔄 Testing login redirect...");
    window.location.href =
      "/login?redirect=" +
      encodeURIComponent("/test-redirect?from_redirect=login");
  };

  const testStudioRedirect = () => {
    addTestResult("🔄 Testing studio redirect...");
    window.location.href = "/studio";
  };

  const testProfileRedirect = () => {
    addTestResult("🔄 Testing profile redirect...");
    window.location.href = "/profile";
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/50 to-white py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-canela text-oma-plum mb-8">
          Login Redirect Test Page
        </h1>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Auth Status</h2>
          <div className="mb-4">
            <strong>User:</strong>{" "}
            {user ? `${user.email} (Logged in)` : "Not logged in"}
          </div>

          {user && (
            <div className="text-green-600 font-medium">
              ✅ You are logged in! The redirect functionality worked correctly.
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Test Redirect Functionality
          </h2>
          <p className="text-gray-600 mb-6">
            These tests will redirect you to protected pages. If you're not
            logged in, you should be redirected to login and then back here
            after signing in.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Button
              onClick={testLoginRedirect}
              className="bg-oma-plum hover:bg-oma-plum/90"
            >
              Test Login Redirect
            </Button>

            <Button
              onClick={testStudioRedirect}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Test Studio Access
            </Button>

            <Button
              onClick={testProfileRedirect}
              className="bg-green-600 hover:bg-green-700"
            >
              Test Profile Access
            </Button>
          </div>

          <Button onClick={clearResults} variant="outline" className="mr-4">
            Clear Results
          </Button>

          <Link href="/login">
            <Button variant="outline">Go to Login Page</Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          {testResults.length === 0 ? (
            <p className="text-gray-500">
              No test results yet. Click a test button above.
            </p>
          ) : (
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="p-2 bg-gray-50 rounded text-sm font-mono"
                >
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">How to Test:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>If you're logged in, sign out first</li>
            <li>Click "Test Studio Access" or "Test Profile Access"</li>
            <li>You should be redirected to the login page</li>
            <li>Sign in with your credentials</li>
            <li>
              You should be redirected back to this page with a success message
            </li>
            <li>Check the test results section for confirmation</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
