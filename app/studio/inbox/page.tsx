"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import InboxClient from "./InboxClient";
import { LoadingPage } from "@/components/ui/loading";

// Simple authentication test component
function AuthTest() {
  const [testResult, setTestResult] = useState("Testing...");

  useEffect(() => {
    const testAuth = async () => {
      try {
        const response = await fetch("/api/studio/inbox/stats", {
          credentials: "include",
        });

        if (response.ok) {
          setTestResult("✅ Authentication working");
        } else {
          setTestResult(
            `❌ Auth failed: ${response.status} ${response.statusText}`
          );
        }
      } catch (error) {
        setTestResult(
          `❌ Error: ${error instanceof Error ? error.message : "Unknown"}`
        );
      }
    };

    testAuth();
  }, []);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="text-sm">
        <strong>🔧 Auth Test:</strong> {testResult}
      </div>
      {testResult.includes("❌") && (
        <div className="mt-2 text-xs text-blue-700">
          Try refreshing the page or signing out and back in if you see
          authentication failures.
        </div>
      )}
    </div>
  );
}

export default function InboxPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    // Check if user has required permissions
    if (user && !["super_admin", "brand_admin"].includes(user.role || "")) {
      router.push("/studio");
      return;
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingPage />;
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (!["super_admin", "brand_admin"].includes(user.role || "")) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-semibold">Access Restricted</h3>
          <p className="text-yellow-600 text-sm mt-1">
            You don't have permission to access the inbox. Only super admins and
            brand admins can view this page.
          </p>
          <div className="mt-2 text-xs text-yellow-700">
            Current role: {user.role || "none"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Studio Inbox</h1>
        <p className="mt-2 text-gray-600">
          Manage customer inquiries and messages
        </p>
      </div>

      {/* Simple auth test for development */}
      {process.env.NODE_ENV === "development" && <AuthTest />}

      <InboxClient userProfile={user} />
    </div>
  );
}
