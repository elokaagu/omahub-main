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
  InboxIcon,
  ArrowPathIcon,
  ChatBubbleLeftIcon,
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
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  type: string;
  status: string;
  priority: string;
  source: string;
  created_at: string;
  updated_at: string;
  read: boolean;
  replied_at?: string;
  brand_name: string;
  brand_category?: string;
  brand_image?: string;
  replies_count: number;
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
    if (!inquiry.read) {
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
            inq.id === inquiry.id ? { ...inq, status: "read", read: true } : inq
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
      <div className="bg-white rounded-lg shadow-sm border border-oma-beige">
        <div className="px-6 py-4 border-b border-oma-beige">
          <h3 className="text-lg font-canela text-oma-plum">
            Loading Inquiries...
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="border border-oma-beige rounded-lg p-4 animate-pulse"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-2">
                    <div className="h-4 bg-oma-beige rounded w-32"></div>
                    <div className="h-3 bg-oma-beige rounded w-48"></div>
                  </div>
                  <div className="h-6 bg-oma-beige rounded w-16"></div>
                </div>
                <div className="h-4 bg-oma-beige rounded w-full"></div>
                <div className="h-4 bg-oma-beige rounded w-3/4 mt-2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold font-canela">
          Error Loading Inquiries
        </h3>
        <p className="text-red-600 text-sm mt-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-oma-plum text-white rounded-lg hover:bg-oma-plum/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (inquiries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-oma-beige">
        <div className="px-6 py-4 border-b border-oma-beige">
          <h3 className="text-lg font-canela text-oma-plum">
            Customer Inquiries
          </h3>
        </div>
        <div className="text-center py-16 bg-oma-cream/30">
          <div className="mx-auto h-16 w-16 text-oma-cocoa mb-4">
            <InboxIcon className="h-full w-full" />
          </div>
          <h3 className="text-xl font-canela text-oma-plum mb-2">
            No Inquiries Found
          </h3>
          <p className="text-oma-cocoa">
            No inquiries match your current filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-oma-beige overflow-hidden">
      <div className="px-6 py-4 border-b border-oma-beige">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-canela text-oma-plum">
            Customer Inquiries ({inquiries.length})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-oma-cocoa hover:text-oma-plum hover:bg-oma-cream rounded-lg transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-oma-beige">
        {inquiries.map((inquiry) => (
          <div
            key={inquiry.id}
            onClick={() => onInquirySelect(inquiry.id)}
            className="p-6 hover:bg-oma-cream/50 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-oma-plum">
                    {inquiry.name}
                  </h4>
                  {!inquiry.read && (
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                </div>
                <p className="text-sm text-oma-cocoa">{inquiry.email}</p>
                {inquiry.phone && (
                  <p className="text-sm text-oma-cocoa">{inquiry.phone}</p>
                )}
                {inquiry.brand_name && (
                  <p className="text-xs text-oma-plum mt-1 bg-oma-beige px-2 py-1 rounded-full inline-block">
                    Brand: {inquiry.brand_name}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      inquiry.status
                    )}`}
                  >
                    {inquiry.status}
                  </span>
                  {inquiry.priority && inquiry.priority !== "normal" && (
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                        inquiry.priority
                      )}`}
                    >
                      {inquiry.priority}
                    </span>
                  )}
                </div>
                <p className="text-xs text-oma-cocoa">
                  {new Date(inquiry.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Inquiry Type */}
            {inquiry.type && (
              <div className="mb-3">
                <span className="text-xs text-oma-cocoa bg-oma-beige px-2 py-1 rounded-full">
                  {inquiry.type.replace("_", " ").toUpperCase()}
                </span>
              </div>
            )}

            {/* Message Preview */}
            <p className="text-oma-cocoa text-sm leading-relaxed line-clamp-2">
              {inquiry.message}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                {!inquiry.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // markAsRead function would need to be implemented
                    }}
                    className="text-xs text-oma-plum hover:text-oma-plum/80 underline"
                  >
                    Mark as read
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onInquirySelect(inquiry.id);
                  }}
                  className="text-xs text-oma-plum hover:text-oma-plum/80 underline"
                >
                  View details
                </button>
              </div>
              <div className="flex items-center gap-1">
                <ChatBubbleLeftIcon className="h-4 w-4 text-oma-cocoa" />
                <span className="text-xs text-oma-cocoa">
                  {inquiry.replies_count || 0} replies
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper functions for status and priority colors
function getStatusColor(status: string): string {
  switch (status) {
    case "unread":
    case "new":
      return "bg-blue-100 text-blue-800 border border-blue-200";
    case "read":
    case "in_progress":
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    case "replied":
      return "bg-green-100 text-green-800 border border-green-200";
    case "closed":
      return "bg-gray-100 text-gray-800 border border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border border-gray-200";
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-800 border border-red-200";
    case "high":
      return "bg-orange-100 text-orange-800 border border-orange-200";
    case "low":
      return "bg-gray-100 text-gray-800 border border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border border-gray-200";
  }
}
