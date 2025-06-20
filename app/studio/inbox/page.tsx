"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { LoadingPage } from "@/components/ui/loading";
import AuthTest from "@/components/studio/AuthTest";

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
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Studio Inbox</h1>
          <p className="mt-2 text-gray-600">
            Manage customer inquiries and messages
          </p>
        </div>

        {/* Auth Test Component for debugging */}
        <AuthTest />

        {/* Simple Auth Status Check */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            🔍 Direct Auth Status
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">useAuth() user:</span>
              <span className={user ? "text-green-600" : "text-red-600"}>
                {user ? `✅ ${user.email} (${user.role})` : "❌ No user"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Loading state:</span>
              <span className="text-gray-700">
                {loading ? "⏳ Loading..." : "✅ Loaded"}
              </span>
            </div>
            {user && (
              <div className="text-xs text-gray-600 mt-2">
                <p>
                  <strong>User ID:</strong> {user.id}
                </p>
                <p>
                  <strong>Role:</strong> {user.role}
                </p>
                <p>
                  <strong>Owned Brands:</strong>{" "}
                  {JSON.stringify(user.owned_brands)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Inbox content will be loaded here */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">📧</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Inbox Loading...
            </h3>
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                If the Auth Test above shows success, your inbox should load
                here.
              </p>

              {!user && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="text-amber-800 font-semibold mb-2">
                    Authentication Required
                  </h3>
                  <p className="text-amber-700 text-sm mb-3">
                    You need to sign in to access the studio inbox. The Auth
                    Test above shows you're not currently authenticated.
                  </p>
                  <button
                    onClick={() => router.push("/login")}
                    className="px-4 py-2 bg-oma-plum text-white rounded text-sm hover:bg-oma-plum/90 font-medium"
                  >
                    🔐 Sign In Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
