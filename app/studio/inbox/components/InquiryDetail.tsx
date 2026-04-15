"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  UserIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  PrinterIcon,
  ShareIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const WORKFLOW_STATUSES = ["new", "pending", "replied", "closed"] as const;
type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

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
}

interface Reply {
  id: string;
  inquiry_id: string;
  admin_id: string;
  message: string;
  is_internal_note: boolean;
  created_at: string;
  updated_at?: string;
  admin?: {
    first_name?: string | null;
    last_name?: string | null;
    email: string;
  } | null;
}

interface InquiryDetailProps {
  inquiryId: string;
  onBack: () => void;
}

function messageForHttpStatus(status: number): string {
  if (status === 401) return "Please sign in to view this inquiry.";
  if (status === 403) return "You don't have permission to view this inquiry.";
  if (status === 404) return "This inquiry could not be found.";
  if (status >= 500) return "Server error while loading the inquiry.";
  return `Unable to load inquiry (${status}).`;
}

function mapInquiryFromApi(raw: Record<string, unknown>, replyCount: number): Inquiry {
  const brand = raw.brand as { name?: string; category?: string } | null | undefined;
  return {
    id: String(raw.id ?? ""),
    brand_id: String(raw.brand_id ?? ""),
    name: String(raw.customer_name ?? ""),
    email: String(raw.customer_email ?? ""),
    phone: raw.customer_phone ? String(raw.customer_phone) : undefined,
    subject: String(raw.subject ?? ""),
    message: String(raw.message ?? ""),
    type: String(raw.inquiry_type ?? raw.type ?? ""),
    status: String(raw.status ?? ""),
    priority: String(raw.priority ?? "normal"),
    source: String(raw.source ?? ""),
    created_at: String(raw.created_at ?? ""),
    updated_at: String(raw.updated_at ?? ""),
    read: Boolean(raw.is_read),
    replied_at: raw.replied_at ? String(raw.replied_at) : undefined,
    brand_name: brand?.name ? String(brand.name) : "",
    brand_category: brand?.category ? String(brand.category) : undefined,
    replies_count: replyCount,
  };
}

function normalizeAdmin(raw: unknown): Reply["admin"] {
  if (!raw || typeof raw !== "object") return null;
  if (Array.isArray(raw)) {
    return raw[0] && typeof raw[0] === "object"
      ? (raw[0] as Reply["admin"])
      : null;
  }
  return raw as Reply["admin"];
}

function mapReplyFromApi(raw: Record<string, unknown>): Reply {
  return {
    id: String(raw.id ?? ""),
    inquiry_id: String(raw.inquiry_id ?? ""),
    admin_id: String(raw.admin_id ?? ""),
    message: String(raw.message ?? ""),
    is_internal_note: Boolean(raw.is_internal_note),
    created_at: String(raw.created_at ?? ""),
    updated_at: raw.updated_at ? String(raw.updated_at) : undefined,
    admin: normalizeAdmin(raw.admin),
  };
}

function formatTypeLabel(type: string): string {
  return type.replace(/_/g, " ").toUpperCase();
}

function replyAuthorName(reply: Reply): string {
  const a = reply.admin;
  if (!a) return "Team member";
  const parts = [a.first_name, a.last_name].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return a.email || "Team member";
}

function workflowSelectValue(status: string): WorkflowStatus {
  return WORKFLOW_STATUSES.includes(status as WorkflowStatus)
    ? (status as WorkflowStatus)
    : "new";
}

export default function InquiryDetail({ inquiryId, onBack }: InquiryDetailProps) {
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

  const fetchInFlightRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const replyFormRef = useRef<HTMLDivElement>(null);

  const canNativeShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function";

  const fetchInquiryDetails = useCallback(async () => {
    if (fetchInFlightRef.current) return;
    fetchInFlightRef.current = true;

    const isInitial = isInitialLoadRef.current;
    if (isInitial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const [detailRes, repliesRes] = await Promise.all([
        fetch(`/api/studio/inbox/${inquiryId}`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }),
        fetch(`/api/studio/inbox/${inquiryId}/replies`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }),
      ]);

      if (!detailRes.ok) {
        throw new Error(messageForHttpStatus(detailRes.status));
      }

      const detailJson = (await detailRes.json()) as {
        success?: boolean;
        inquiry?: Record<string, unknown>;
      };
      const raw = detailJson.inquiry;
      if (!raw || typeof raw !== "object") {
        throw new Error("Invalid response from server.");
      }

      let replyList: Reply[] = [];
      if (repliesRes.ok) {
        const repliesJson = (await repliesRes.json()) as { replies?: unknown[] };
        replyList = (repliesJson.replies || []).map((r) =>
          mapReplyFromApi(r as Record<string, unknown>)
        );
      } else if (repliesRes.status !== 404) {
        console.warn("InquiryDetail: replies fetch failed", repliesRes.status);
      }

      setInquiry(mapInquiryFromApi(raw, replyList.length));
      setReplies(replyList);
    } catch (err) {
      console.error("Error fetching inquiry details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load inquiry details"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      fetchInFlightRef.current = false;
      isInitialLoadRef.current = false;
    }
  }, [inquiryId]);

  useEffect(() => {
    void fetchInquiryDetails();
  }, [fetchInquiryDetails]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = replyMessage.trim();
    if (!trimmed) {
      toast.error("Write a message before sending.");
      return;
    }

    const wasInternal = isInternalNote;

    try {
      setSendingReply(true);
      const response = await fetch(`/api/studio/inbox/${inquiryId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: trimmed,
          isInternalNote: wasInternal,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errorData.error || "Failed to send reply");
      }

      const data = (await response.json()) as { reply?: Record<string, unknown> };
      if (data.reply) {
        setReplies((prev) => [...prev, mapReplyFromApi(data.reply!)]);
      }

      if (!wasInternal) {
        setInquiry((prev) =>
          prev
            ? {
                ...prev,
                status: "replied",
                replies_count: prev.replies_count + 1,
              }
            : null
        );
        toast.success("Reply sent. The customer has been notified by email.");
      } else {
        toast.success("Internal note added.");
      }

      setReplyMessage("");
      setIsInternalNote(false);
    } catch (err) {
      console.error("Error sending reply:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send reply";

      if (
        errorMessage.includes("Email service not configured") ||
        errorMessage.includes("RESEND_API_KEY")
      ) {
        toast.warning(
          "Reply was saved, but email could not be sent. Check email configuration."
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusUpdate = async (newStatus: WorkflowStatus) => {
    if (!inquiry || inquiry.status === newStatus) return;

    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/studio/inbox/${inquiryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errBody = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errBody.error || "Failed to update status");
      }

      const data = (await response.json()) as {
        inquiry?: Record<string, unknown>;
      };
      if (data.inquiry && typeof data.inquiry === "object") {
        setInquiry(mapInquiryFromApi(data.inquiry, replies.length));
      } else {
        setInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      toast.success("Status updated.");
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleMarkAsRead = async () => {
    if (!inquiry) return;

    try {
      setMarkingRead(true);
      const response = await fetch(`/api/studio/inbox/${inquiryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_read: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark as read");
      }

      const data = (await response.json()) as {
        inquiry?: Record<string, unknown>;
      };
      if (data.inquiry && typeof data.inquiry === "object") {
        setInquiry(mapInquiryFromApi(data.inquiry, replies.length));
      } else {
        setInquiry((prev) => (prev ? { ...prev, read: true } : null));
      }
      toast.success("Marked as read.");
    } catch (err) {
      console.error("Error marking as read:", err);
      toast.error("Could not mark as read. Try again.");
    } finally {
      setMarkingRead(false);
    }
  };

  const scrollToReplyForm = () => {
    replyFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleShareOrCopy = async () => {
    if (!inquiry) return;
    const title = inquiry.subject || "Inquiry";
    const text = `${title}\n\n${inquiry.message}`;

    if (canNativeShare) {
      try {
        await navigator.share({ title, text });
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          toast.error("Share was cancelled or failed.");
        }
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Inquiry copied to clipboard.");
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  };

  function getStatusColor(status: string): string {
    switch (status) {
      case "unread":
      case "new":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "read":
      case "pending":
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-oma-beige p-6">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <div className="h-6 bg-oma-beige rounded w-48"></div>
              <div className="h-4 bg-oma-beige rounded w-32"></div>
              <div className="h-4 bg-oma-beige rounded w-40"></div>
            </div>
            <div className="h-8 bg-oma-beige rounded w-20"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-oma-beige rounded w-full"></div>
            <div className="h-4 bg-oma-beige rounded w-3/4"></div>
            <div className="h-4 bg-oma-beige rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold font-canela">
          Error Loading Inquiry
        </h3>
        <p className="text-red-600 text-sm mt-2">{error}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 border-oma-plum/30 text-oma-plum"
          onClick={() => void fetchInquiryDetails()}
          disabled={refreshing}
        >
          {refreshing ? "Retrying…" : "Try again"}
        </Button>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-oma-beige p-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-canela text-oma-plum mb-2">
            Select an Inquiry
          </h3>
          <p className="text-oma-cocoa">
            Choose an inquiry from the list to view details.
          </p>
        </div>
      </div>
    );
  }

  const statusSelectValue = workflowSelectValue(inquiry.status);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-oma-beige overflow-hidden">
      <div className="px-6 py-3 border-b border-oma-beige bg-oma-cream/20 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 border-oma-beige"
          onClick={onBack}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to list
        </Button>
      </div>

      {/* Header */}
      <div className="px-6 py-4 border-b border-oma-beige bg-oma-cream/30">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-canela text-oma-plum">
                {inquiry.subject || "General Inquiry"}
              </h1>
              {!inquiry.read && (
                <span
                  className="inline-block w-3 h-3 bg-blue-500 rounded-full shrink-0"
                  title="Unread"
                />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-oma-cocoa">
              <span className="flex items-center gap-1">
                <UserIcon className="h-4 w-4 shrink-0" />
                {inquiry.name}
              </span>
              <span className="flex items-center gap-1">
                <EnvelopeIcon className="h-4 w-4 shrink-0" />
                {inquiry.email}
              </span>
              {inquiry.phone && (
                <span className="flex items-center gap-1">
                  <PhoneIcon className="h-4 w-4 shrink-0" />
                  {inquiry.phone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4 shrink-0" />
                {new Date(inquiry.created_at).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full w-fit ${getStatusColor(
                inquiry.status
              )}`}
            >
              {inquiry.status.replace(/_/g, " ")}
            </span>
            {inquiry.priority && inquiry.priority !== "normal" && (
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full w-fit ${getPriorityColor(
                  inquiry.priority
                )}`}
              >
                {inquiry.priority}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <Label className="text-oma-cocoa shrink-0">Workflow status</Label>
          <Select
            value={statusSelectValue}
            onValueChange={(v) => void handleStatusUpdate(v as WorkflowStatus)}
            disabled={updatingStatus}
          >
            <SelectTrigger className="w-full sm:w-56 border-oma-beige">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {WORKFLOW_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {updatingStatus && (
            <span className="text-xs text-oma-cocoa">Updating…</span>
          )}
        </div>
      </div>

      {(inquiry.brand_name || inquiry.type || inquiry.source) && (
        <div className="px-6 py-4 border-b border-oma-beige bg-white">
          <div className="flex flex-wrap items-center gap-4">
            {inquiry.brand_name && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-oma-cocoa">
                  Brand:
                </span>
                <span className="text-sm text-oma-plum bg-oma-beige px-3 py-1 rounded-full">
                  {inquiry.brand_name}
                </span>
              </div>
            )}
            {inquiry.type && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-oma-cocoa">
                  Type:
                </span>
                <span className="text-sm text-oma-cocoa bg-gray-100 px-3 py-1 rounded-full">
                  {formatTypeLabel(inquiry.type)}
                </span>
              </div>
            )}
            {inquiry.source && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-oma-cocoa">
                  Source:
                </span>
                <span className="text-sm text-oma-cocoa bg-gray-100 px-3 py-1 rounded-full">
                  {inquiry.source}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="px-6 py-6">
        <h3 className="text-lg font-canela text-oma-plum mb-4">Message</h3>
        <div className="bg-oma-cream/50 rounded-lg p-6 border border-oma-beige">
          <p className="text-oma-cocoa leading-relaxed whitespace-pre-wrap">
            {inquiry.message}
          </p>
        </div>
      </div>

      {(replies.length > 0 || inquiry.replies_count > 0) && (
        <div className="px-6 py-6 border-t border-oma-beige">
          <h3 className="text-lg font-canela text-oma-plum mb-4">
            Replies ({Math.max(replies.length, inquiry.replies_count)})
          </h3>
          {replies.length === 0 ? (
            <p className="text-sm text-oma-cocoa/80">
              Replies exist but could not be loaded. Use Try again above or
              refresh the page.
            </p>
          ) : (
            <ul className="space-y-4">
              {replies.map((reply) => (
                <li
                  key={reply.id}
                  className={cn(
                    "rounded-lg border p-4",
                    reply.is_internal_note
                      ? "border-amber-200 bg-amber-50/60"
                      : "border-oma-beige bg-white"
                  )}
                >
                  <div className="flex flex-wrap justify-between gap-2 text-xs text-oma-cocoa mb-2">
                    <span className="font-medium text-oma-plum">
                      {replyAuthorName(reply)}
                      {reply.is_internal_note && (
                        <span className="ml-2 text-amber-800">(internal)</span>
                      )}
                    </span>
                    <time dateTime={reply.created_at}>
                      {new Date(reply.created_at).toLocaleString("en-GB")}
                    </time>
                  </div>
                  <p className="text-sm text-oma-cocoa whitespace-pre-wrap">
                    {reply.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div ref={replyFormRef} className="px-6 py-6 border-t border-oma-beige">
        <h3 className="text-lg font-canela text-oma-plum mb-4">
          Reply or internal note
        </h3>
        <form onSubmit={handleSendReply} className="space-y-4">
          <div>
            <Label htmlFor="inquiry-reply-body" className="text-oma-cocoa">
              Message
            </Label>
            <Textarea
              id="inquiry-reply-body"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply to the customer or an internal note…"
              rows={5}
              className="mt-1 border-oma-beige"
              maxLength={5000}
            />
            <p className="text-xs text-oma-cocoa/70 mt-1">
              Customer replies trigger an email when email is configured. Internal
              notes stay in the studio only.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="internal-note"
              checked={isInternalNote}
              onCheckedChange={(c) => setIsInternalNote(c === true)}
            />
            <Label htmlFor="internal-note" className="text-sm font-normal cursor-pointer">
              Internal note only (do not email the customer)
            </Label>
          </div>
          <Button
            type="submit"
            disabled={sendingReply}
            className="bg-oma-plum hover:bg-oma-plum/90 gap-2"
          >
            {sendingReply ? (
              <Loader2 className="h-4 w-4" />
            ) : (
              <PaperAirplaneIcon className="h-4 w-4" />
            )}
            {sendingReply ? "Sending…" : "Send"}
          </Button>
        </form>
      </div>

      <div className="px-6 py-4 border-t border-oma-beige bg-oma-cream/30">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {!inquiry.read && (
              <Button
                type="button"
                onClick={() => void handleMarkAsRead()}
                disabled={markingRead}
                className="bg-oma-plum hover:bg-oma-plum/90 gap-2"
              >
                <EyeIcon className="h-4 w-4" />
                {markingRead ? "Marking…" : "Mark as read"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="border-oma-beige gap-2"
              onClick={scrollToReplyForm}
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              Jump to reply
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-oma-cocoa hover:text-oma-plum"
              title="Print"
              onClick={() => window.print()}
            >
              <PrinterIcon className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-oma-cocoa hover:text-oma-plum"
              title={canNativeShare ? "Share" : "Copy to clipboard"}
              onClick={() => void handleShareOrCopy()}
            >
              {canNativeShare ? (
                <ShareIcon className="h-5 w-5" />
              ) : (
                <ClipboardDocumentIcon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
