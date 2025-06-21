"use client";

import { useState, useEffect } from "react";
import {
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";

interface UserProfile {
  role: string;
  owned_brands: string[];
}

interface InboxFilters {
  status?: string;
  priority?: string;
  type?: string;
  brandId?: string;
  search?: string;
}

interface Inquiry {
  id: string;
  brand_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  subject: string;
  message: string;
  inquiry_type: string;
  status: string;
  priority: string;
  source: string;
  created_at: string;
  updated_at: string;
  read_at?: string;
  replied_at?: string;
  brand_name: string;
  brand_category?: string;
  brand_image?: string;
  reply_count: number;
  latest_reply_message?: string;
  latest_reply_at?: string;
  latest_reply_admin?: string;
}

interface InquiryListProps {
  filters: InboxFilters;
  onInquirySelect: (inquiryId: string) => void;
  userProfile: UserProfile;
}

export default function InquiryList({
  filters,
  onInquirySelect,
  userProfile,
}: InquiryListProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchInquiries();
  }, [filters, currentPage]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });

      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/studio/inbox?${params}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch inquiries");
      }

      const data = await response.json();
      setInquiries(data.inquiries);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (err) {
      console.error("Error fetching inquiries:", err);
      setError(err instanceof Error ? err.message : "Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  const handleInquiryClick = async (inquiry: Inquiry) => {
    // Mark as read if unread
    if (inquiry.status === "unread") {
      try {
        await fetch(`/api/studio/inbox/${inquiry.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            status: "read",
            readAt: true,
          }),
        });

        // Update local state
        setInquiries((prev) =>
          prev.map((inq) =>
            inq.id === inquiry.id
              ? { ...inq, status: "read", read_at: new Date().toISOString() }
              : inq
          )
        );
      } catch (error) {
        console.error("Error marking inquiry as read:", error);
      }
    }

    onInquirySelect(inquiry.id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-50 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "normal":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "low":
        return "text-gray-600 bg-gray-50 border-gray-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "unread":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "read":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "replied":
        return "text-green-600 bg-green-50 border-green-200";
      case "closed":
        return "text-gray-600 bg-gray-50 border-gray-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "unread":
        return ExclamationTriangleIcon;
      case "read":
        return EyeIcon;
      case "replied":
        return CheckCircleIcon;
      case "closed":
        return ClockIcon;
      default:
        return ClockIcon;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading inquiries: {error}</p>
          <button
            onClick={fetchInquiries}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Inquiries ({totalCount})
          </h2>
          {Object.keys(filters).some(
            (key) => filters[key as keyof InboxFilters]
          ) && <span className="text-sm text-gray-500">Filtered results</span>}
        </div>
      </div>

      {/* Inquiry List */}
      <div className="divide-y divide-gray-200">
        {inquiries.length === 0 ? (
          <div className="p-8 text-center">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No inquiries found
            </h3>
            <p className="text-gray-500">
              {Object.keys(filters).some(
                (key) => filters[key as keyof InboxFilters]
              )
                ? "Try adjusting your filters to see more results."
                : "Customer inquiries will appear here when they contact your brand."}
            </p>
          </div>
        ) : (
          inquiries.map((inquiry) => {
            const StatusIcon = getStatusIcon(inquiry.status);
            const isUnread = inquiry.status === "unread";

            return (
              <div
                key={inquiry.id}
                onClick={() => handleInquiryClick(inquiry)}
                className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                  isUnread ? "bg-blue-50/30" : ""
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-gray-500" />
                      </div>
                    </div>
                    <div>
                      <h3
                        className={`font-medium ${isUnread ? "text-gray-900 font-semibold" : "text-gray-900"}`}
                      >
                        {inquiry.customer_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {inquiry.customer_email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Priority Badge */}
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(inquiry.priority)}`}
                    >
                      {inquiry.priority}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(inquiry.status)}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {inquiry.status}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <h4
                    className={`text-sm ${isUnread ? "font-semibold text-gray-900" : "font-medium text-gray-800"} mb-1`}
                  >
                    {inquiry.subject}
                  </h4>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {inquiry.message}
                  </p>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {formatDistanceToNow(new Date(inquiry.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                    <span className="capitalize">
                      {inquiry.inquiry_type.replace("_", " ")}
                    </span>
                    <span className="capitalize">via {inquiry.source}</span>
                    {userProfile.role === "super_admin" && (
                      <span className="font-medium">{inquiry.brand_name}</span>
                    )}
                  </div>

                  {inquiry.reply_count > 0 && (
                    <div className="flex items-center gap-1">
                      <ChatBubbleLeftRightIcon className="h-3 w-3" />
                      <span>{inquiry.reply_count} replies</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * 20 + 1} to{" "}
              {Math.min(currentPage * 20, totalCount)} of {totalCount} inquiries
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm rounded-lg ${
                        currentPage === page
                          ? "bg-emerald-600 text-white"
                          : "border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
