"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { InboxIcon, ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;
const FETCH_LIMIT = 200;

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
}

function messageForHttpStatus(status: number): string {
  if (status === 401) return "Please sign in to view inquiries.";
  if (status === 403) return "You don't have permission to view these inquiries.";
  if (status >= 500) return "Server error while loading inquiries.";
  return `Unable to load inquiries (${status}).`;
}

function mapListInquiry(raw: Record<string, unknown>): Inquiry {
  const brand = raw.brand as { name?: string; category?: string } | null | undefined;
  return {
    id: String(raw.id ?? ""),
    brand_id: String(raw.brand_id ?? ""),
    name: String(raw.customer_name ?? ""),
    email: String(raw.customer_email ?? ""),
    phone: raw.customer_phone ? String(raw.customer_phone) : undefined,
    subject: String(raw.subject ?? ""),
    message: String(raw.message ?? ""),
    type: String(raw.inquiry_type ?? ""),
    status: String(raw.status ?? ""),
    priority: String(raw.priority ?? "normal"),
    source: String(raw.source ?? ""),
    created_at: String(raw.created_at ?? ""),
    updated_at: String(raw.updated_at ?? ""),
    read: Boolean(raw.is_read),
    replied_at: raw.replied_at ? String(raw.replied_at) : undefined,
    brand_name: brand?.name ? String(brand.name) : "",
    brand_category: brand?.category ? String(brand.category) : undefined,
    brand_image: undefined,
    replies_count: 0,
    latest_reply_message: undefined,
    latest_reply_at: undefined,
    latest_reply_admin: undefined,
  };
}

function formatTypeLabel(type: string): string {
  return type.replace(/_/g, " ").toUpperCase();
}

function inquiryMatchesFilters(inquiry: Inquiry, filters: InboxFilters): boolean {
  if (filters.status) {
    if (filters.status === "unread") {
      const unreadLike =
        !inquiry.read ||
        inquiry.status === "unread" ||
        inquiry.status === "new";
      if (!unreadLike) return false;
    } else if (inquiry.status !== filters.status) {
      return false;
    }
  }
  if (filters.priority && inquiry.priority !== filters.priority) return false;
  if (filters.type && inquiry.type !== filters.type) return false;
  if (filters.brandId && inquiry.brand_id !== filters.brandId) return false;
  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    if (!q) return true;
    const hay = [
      inquiry.name,
      inquiry.email,
      inquiry.subject,
      inquiry.message,
      inquiry.brand_name,
    ]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function getPriorityColor(priority: string) {
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
}

function getStatusColor(status: string) {
  switch (status) {
    case "unread":
    case "new":
      return "text-orange-600 bg-orange-50 border-orange-200";
    case "read":
    case "pending":
    case "in_progress":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "replied":
      return "text-green-600 bg-green-50 border-green-200";
    case "closed":
      return "text-gray-600 bg-gray-50 border-gray-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export default function InquiryList({
  filters,
  onInquirySelect,
}: InquiryListProps) {
  const [allInquiries, setAllInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [markingReadId, setMarkingReadId] = useState<string | null>(null);

  const isFirstFetch = useRef(true);
  const fetchInFlight = useRef(false);

  const fetchInquiries = useCallback(async () => {
    if (fetchInFlight.current) return;
    fetchInFlight.current = true;

    if (isFirstFetch.current) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const response = await fetch(
        `/api/studio/inbox?inquiriesLimit=${FETCH_LIMIT}`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const errJson = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          errJson.error || messageForHttpStatus(response.status)
        );
      }

      const data = (await response.json()) as {
        success?: boolean;
        inquiries?: Record<string, unknown>[];
        error?: string;
      };

      if (data.error) {
        throw new Error(data.error);
      }

      const rows = data.inquiries ?? [];
      setAllInquiries(rows.map((r) => mapListInquiry(r)));
    } catch (err) {
      console.error("Error fetching inquiries:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load inquiries"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      fetchInFlight.current = false;
      isFirstFetch.current = false;
    }
  }, []);

  useEffect(() => {
    void fetchInquiries();
  }, [fetchInquiries]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const filteredInquiries = useMemo(
    () => allInquiries.filter((i) => inquiryMatchesFilters(i, filters)),
    [allInquiries, filters]
  );

  const totalCount = filteredInquiries.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pageInquiries = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredInquiries.slice(start, start + PAGE_SIZE);
  }, [filteredInquiries, currentPage]);

  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalCount);

  const markInquiryReadOnServer = useCallback(
    async (inquiryId: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/studio/inbox/${inquiryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ is_read: true }),
        });
        if (!response.ok) return false;
        setAllInquiries((prev) =>
          prev.map((inq) =>
            inq.id === inquiryId ? { ...inq, read: true } : inq
          )
        );
        return true;
      } catch (e) {
        console.error("Error marking inquiry as read:", e);
        return false;
      }
    },
    []
  );

  const handleInquiryOpen = useCallback(
    async (inquiry: Inquiry) => {
      if (!inquiry.read) {
        setMarkingReadId(inquiry.id);
        const ok = await markInquiryReadOnServer(inquiry.id);
        setMarkingReadId(null);
        if (!ok) {
          toast.error("Could not mark as read. You can still open the inquiry.");
        }
      }
      onInquirySelect(inquiry.id);
    },
    [markInquiryReadOnServer, onInquirySelect]
  );

  const handleMarkAsReadOnly = useCallback(
    async (e: React.MouseEvent, inquiry: Inquiry) => {
      e.stopPropagation();
      if (inquiry.read) return;
      setMarkingReadId(inquiry.id);
      const ok = await markInquiryReadOnServer(inquiry.id);
      setMarkingReadId(null);
      if (ok) toast.success("Marked as read");
      else toast.error("Could not mark as read");
    },
    [markInquiryReadOnServer]
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-oma-beige">
        <div className="px-6 py-4 border-b border-oma-beige">
          <h3 className="text-lg font-canela text-oma-plum">
            Loading inquiries…
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
          Error loading inquiries
        </h3>
        <p className="text-red-600 text-sm mt-2">{error}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 border-oma-plum/30 text-oma-plum"
          onClick={() => void fetchInquiries()}
          disabled={refreshing}
        >
          {refreshing ? "Retrying…" : "Try again"}
        </Button>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-oma-beige">
        <div className="px-6 py-4 border-b border-oma-beige">
          <h3 className="text-lg font-canela text-oma-plum">
            Customer inquiries
          </h3>
        </div>
        <div className="text-center py-16 bg-oma-cream/30">
          <div className="mx-auto h-16 w-16 text-oma-cocoa mb-4">
            <InboxIcon className="h-full w-full" />
          </div>
          <h3 className="text-xl font-canela text-oma-plum mb-2">
            No inquiries found
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-canela text-oma-plum">
              Customer inquiries
            </h3>
            <p className="text-sm text-oma-cocoa mt-0.5">
              Showing {rangeStart}–{rangeEnd} of {totalCount}
              {allInquiries.length >= FETCH_LIMIT && totalCount >= FETCH_LIMIT
                ? ` (loaded up to ${FETCH_LIMIT} most recent)`
                : null}
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-oma-beige">
        {pageInquiries.map((inquiry) => (
          <div
            key={inquiry.id}
            role="button"
            tabIndex={0}
            onClick={() => void handleInquiryOpen(inquiry)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                void handleInquiryOpen(inquiry);
              }
            }}
            className="p-6 hover:bg-oma-cream/50 cursor-pointer transition-colors text-left w-full"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-oma-plum">{inquiry.name}</h4>
                  {!inquiry.read && (
                    <span
                      className="inline-block w-2 h-2 bg-blue-500 rounded-full shrink-0"
                      title="Unread"
                    />
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
                <div className="flex items-center gap-2 mb-2 justify-end">
                  <span
                    className={cn(
                      "inline-block px-3 py-1 text-xs font-medium rounded-full border",
                      getStatusColor(inquiry.status)
                    )}
                  >
                    {inquiry.status.replace(/_/g, " ")}
                  </span>
                  {inquiry.priority && inquiry.priority !== "normal" && (
                    <span
                      className={cn(
                        "inline-block px-2 py-1 text-xs font-medium rounded-full border",
                        getPriorityColor(inquiry.priority)
                      )}
                    >
                      {inquiry.priority}
                    </span>
                  )}
                </div>
                <p className="text-xs text-oma-cocoa">
                  {new Date(inquiry.created_at).toLocaleDateString("en-GB", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {inquiry.type && (
              <div className="mb-3">
                <span className="text-xs text-oma-cocoa bg-oma-beige px-2 py-1 rounded-full">
                  {formatTypeLabel(inquiry.type)}
                </span>
              </div>
            )}

            <p className="text-oma-cocoa text-sm leading-relaxed line-clamp-2">
              {inquiry.message}
            </p>

            <div className="flex items-center justify-between mt-4 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {!inquiry.read && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-oma-plum"
                    disabled={markingReadId === inquiry.id}
                    onClick={(e) => void handleMarkAsReadOnly(e, inquiry)}
                  >
                    {markingReadId === inquiry.id ? "Marking…" : "Mark as read"}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-oma-plum"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleInquiryOpen(inquiry);
                  }}
                >
                  View details
                </Button>
              </div>
              <div className="flex items-center gap-1 text-oma-cocoa">
                <ChatBubbleLeftIcon className="h-4 w-4 shrink-0" />
                <span className="text-xs">
                  {inquiry.replies_count || 0} replies
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-oma-beige flex flex-wrap items-center justify-between gap-3 bg-oma-cream/20">
          <p className="text-sm text-oma-cocoa">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-oma-beige"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-oma-beige"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
