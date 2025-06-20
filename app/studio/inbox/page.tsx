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

        {/* Inbox content will be loaded here */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">📧</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Inbox Loading...
            </h3>
            <p className="text-gray-500">
              If the Auth Test above shows success, your inbox should load here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
