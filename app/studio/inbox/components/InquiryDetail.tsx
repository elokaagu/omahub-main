"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  UserIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { formatDistanceToNow, format } from "date-fns";

interface UserProfile {
  role: string;
  owned_brands: string[];
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
}

interface Reply {
  id: string;
  inquiry_id: string;
  admin_id: string;
  message: string;
  is_internal_note: boolean;
  created_at: string;
  updated_at: string;
  admin: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
}

interface InquiryDetailProps {
  inquiryId: string;
  onBack: () => void;
  userProfile: UserProfile;
}

export default function InquiryDetail({
  inquiryId,
  onBack,
  userProfile,
}: InquiryDetailProps) {
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchInquiryDetails();
  }, [inquiryId]);

  const fetchInquiryDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/studio/inbox/${inquiryId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch inquiry details");
      }

      const data = await response.json();
      setInquiry(data.inquiry);
      setReplies(data.replies || []);
    } catch (err) {
      console.error("Error fetching inquiry details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load inquiry details"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyMessage.trim()) return;

    try {
      setSendingReply(true);

      const response = await fetch(`/api/studio/inbox/${inquiryId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message: replyMessage.trim(),
          isInternalNote,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reply");
      }

      const data = await response.json();

      // Add new reply to the list
      setReplies((prev) => [...prev, data.reply]);

      // Update inquiry status if not internal note
      if (!isInternalNote) {
        setInquiry((prev) =>
          prev
            ? { ...prev, status: "replied", reply_count: prev.reply_count + 1 }
            : null
        );
      }

      // Clear form
      setReplyMessage("");
      setIsInternalNote(false);
    } catch (err) {
      console.error("Error sending reply:", err);
      alert("Failed to send reply. Please try again.");
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!inquiry) return;

    try {
      setUpdatingStatus(true);

      const response = await fetch(`/api/studio/inbox/${inquiryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingStatus(false);
    }
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
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Inquiry Details</h1>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600 mb-4">Error loading inquiry: {error}</p>
          <button
            onClick={fetchInquiryDetails}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!inquiry) {
    return null;
  }

  const StatusIcon = getStatusIcon(inquiry.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {inquiry.subject}
          </h1>
          <p className="text-gray-600 mt-1">
            Inquiry from {inquiry.customer_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Original Inquiry */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-gray-500" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {inquiry.customer_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(inquiry.created_at), "PPpp")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(inquiry.priority)}`}
                    >
                      {inquiry.priority}
                    </span>
                    <span
                      className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(inquiry.status)}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {inquiry.status}
                    </span>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {inquiry.message}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Replies */}
          {replies.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                Replies ({replies.length})
              </h3>

              {replies.map((reply) => (
                <div
                  key={reply.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          reply.is_internal_note
                            ? "bg-yellow-100"
                            : "bg-emerald-100"
                        }`}
                      >
                        {reply.is_internal_note ? (
                          <DocumentTextIcon className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <ChatBubbleLeftRightIcon className="h-5 w-5 text-emerald-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {reply.admin.first_name && reply.admin.last_name
                              ? `${reply.admin.first_name} ${reply.admin.last_name}`
                              : reply.admin.email}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {format(new Date(reply.created_at), "PPpp")}
                          </p>
                        </div>
                        {reply.is_internal_note && (
                          <span className="px-2 py-1 text-xs font-medium text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-full">
                            Internal Note
                          </span>
                        )}
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {reply.message}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reply Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Send Reply
            </h3>

            <form onSubmit={handleSendReply} className="space-y-4">
              <div>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">
                    Internal note (not sent to customer)
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={sendingReply || !replyMessage.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sendingReply ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4" />
                      Send Reply
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Customer Information
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    {inquiry.customer_name}
                  </p>
                  <p className="text-sm text-gray-500">Customer</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    {inquiry.customer_email}
                  </p>
                  <p className="text-sm text-gray-500">Email</p>
                </div>
              </div>

              {inquiry.customer_phone && (
                <div className="flex items-center gap-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {inquiry.customer_phone}
                    </p>
                    <p className="text-sm text-gray-500">Phone</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Inquiry Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Inquiry Details
            </h3>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium text-gray-900 capitalize">
                  {inquiry.inquiry_type.replace("_", " ")}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Source</p>
                <p className="font-medium text-gray-900 capitalize">
                  {inquiry.source}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(inquiry.created_at), "PPP")}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(inquiry.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>

              {userProfile.role === "super_admin" && (
                <div>
                  <p className="text-sm text-gray-500">Brand</p>
                  <p className="font-medium text-gray-900">
                    {inquiry.brand_name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Actions
            </h3>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 mb-2">Update Status</p>
                <div className="space-y-2">
                  {["read", "replied", "closed"].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      disabled={updatingStatus || inquiry.status === status}
                      className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${
                        inquiry.status === status
                          ? "bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {updatingStatus ? "Updating..." : `Mark as ${status}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
