"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { LoadingPage } from "@/components/ui/loading";
import AuthTest from "@/components/studio/AuthTest";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
  brand_name?: string;
}

export default function InboxPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch inquiries
  useEffect(() => {
    const fetchInquiries = async () => {
      if (!user || !["super_admin", "brand_admin"].includes(user.role || "")) {
        return;
      }

      try {
        setLoadingInquiries(true);
        setError(null);

        const response = await fetch("/api/admin/inquiries", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setInquiries(data.inquiries || []);
        } else {
          const errorText = await response.text();
          setError(
            `Failed to fetch inquiries: ${response.status} ${errorText}`
          );
        }
      } catch (err) {
        setError(`Error fetching inquiries: ${err}`);
      } finally {
        setLoadingInquiries(false);
      }
    };

    if (user && !loading) {
      fetchInquiries();
    }
  }, [user, loading]);

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

        {/* Inbox Content */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Customer Inquiries
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Total: {inquiries.length}</span>
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loadingInquiries ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-lg mb-2">⏳</div>
                <p className="text-gray-600">Loading inquiries...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-400 text-lg mb-2">❌</div>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            ) : inquiries.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-4">📧</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No inquiries yet
                </h3>
                <p className="text-gray-600">
                  Customer inquiries will appear here when they contact you.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {inquiry.name}
                        </h4>
                        <p className="text-sm text-gray-600">{inquiry.email}</p>
                        {inquiry.brand_name && (
                          <p className="text-xs text-blue-600 mt-1">
                            Brand: {inquiry.brand_name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded ${
                            inquiry.status === "new"
                              ? "bg-green-100 text-green-800"
                              : inquiry.status === "in_progress"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {inquiry.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(inquiry.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm">{inquiry.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
