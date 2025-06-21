"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { LoadingPage } from "@/components/ui/loading";

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

        const response = await fetch("/api/studio/inbox", {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-canela mb-2 text-oma-plum">
          Studio Inbox
        </h1>
        <p className="text-oma-cocoa">Manage customer inquiries and messages</p>
      </div>

      {/* Loading State */}
      {loadingInquiries ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
        </div>
      ) : error ? (
        /* Error State */
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold font-canela">
            Error Loading Inbox
          </h3>
          <p className="text-red-600 text-sm mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-oma-plum text-white rounded-lg hover:bg-oma-plum/90 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : inquiries.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 bg-oma-cream rounded-lg border border-oma-beige">
          <div className="mx-auto h-16 w-16 text-oma-cocoa mb-4">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h2m0 0V6a2 2 0 012-2h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V9M4 13v4a2 2 0 002 2h2m0 0h2a2 2 0 002-2v-2M9 7h6"
              />
            </svg>
          </div>
          <h3 className="text-xl font-canela text-oma-plum mb-2">
            No Inquiries Yet
          </h3>
          <p className="text-oma-cocoa">
            Customer inquiries will appear here when they contact your brands.
          </p>
        </div>
      ) : (
        /* Inbox Content */
        <div className="bg-white rounded-lg shadow-sm border border-oma-beige overflow-hidden">
          <div className="px-6 py-4 border-b border-oma-beige">
            <h2 className="text-xl font-canela text-oma-plum">
              Recent Inquiries ({inquiries.length})
            </h2>
          </div>
          <div className="divide-y divide-oma-beige">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="p-6 hover:bg-oma-cream/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-oma-plum">
                      {inquiry.name}
                    </h4>
                    <p className="text-sm text-oma-cocoa">{inquiry.email}</p>
                    {inquiry.brand_name && (
                      <p className="text-xs text-oma-plum mt-1 bg-oma-beige px-2 py-1 rounded-full inline-block">
                        Brand: {inquiry.brand_name}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                        inquiry.status === "new"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : inquiry.status === "in_progress"
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                            : "bg-gray-100 text-gray-800 border border-gray-200"
                      }`}
                    >
                      {inquiry.status}
                    </span>
                    <p className="text-xs text-oma-cocoa mt-1">
                      {new Date(inquiry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="text-oma-cocoa text-sm leading-relaxed">
                  {inquiry.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
