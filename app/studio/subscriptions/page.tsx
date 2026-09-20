"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStudioInitialData } from "@/contexts/StudioInitialDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Mail,
  Users,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface NewsletterSubscriber {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  subscription_status: "active" | "unsubscribed" | "bounced" | "pending";
  source: "website" | "contact_form" | "studio_signup" | "manual_import";
  subscribed_at: string;
  unsubscribed_at: string | null;
  last_email_sent: string | null;
  email_count: number;
  created_at: string;
  updated_at: string;
}

interface SubscriptionStats {
  total: number;
  active: number;
  unsubscribed: number;
  bounced: number;
  pending: number;
  thisMonth: number;
  lastMonth: number;
  growth: number;
}

type SubscriberQuery = {
  page: number;
  limit: number;
  search: string;
  status: string;
  source: string;
};

const ITEMS_PER_PAGE = 20;
const DASHBOARD_SECTION =
  "rounded-2xl border border-oma-beige/70 bg-gradient-to-br from-white via-oma-cream/30 to-oma-beige/15 p-5 shadow-sm sm:p-6";
const METRIC_CARD =
  "flex min-h-[7.5rem] flex-col justify-center rounded-xl border border-black/[0.06] bg-white p-5 text-left shadow-sm";

function applyDeleteToStats(
  stats: SubscriptionStats,
  subscriber: NewsletterSubscriber,
): SubscriptionStats {
  const subscribedAt = new Date(subscriber.subscribed_at);
  const now = new Date();
  const subscribedThisMonth =
    subscribedAt.getFullYear() === now.getFullYear() &&
    subscribedAt.getMonth() === now.getMonth();

  return {
    ...stats,
    total: Math.max(0, stats.total - 1),
    active:
      subscriber.subscription_status === "active"
        ? Math.max(0, stats.active - 1)
        : stats.active,
    unsubscribed:
      subscriber.subscription_status === "unsubscribed"
        ? Math.max(0, stats.unsubscribed - 1)
        : stats.unsubscribed,
    bounced:
      subscriber.subscription_status === "bounced"
        ? Math.max(0, stats.bounced - 1)
        : stats.bounced,
    pending:
      subscriber.subscription_status === "pending"
        ? Math.max(0, stats.pending - 1)
        : stats.pending,
    thisMonth: subscribedThisMonth
      ? Math.max(0, stats.thisMonth - 1)
      : stats.thisMonth,
  };
}

function applyStatusToStats(
  stats: SubscriptionStats,
  fromStatus: NewsletterSubscriber["subscription_status"],
  toStatus: NewsletterSubscriber["subscription_status"],
): SubscriptionStats {
  if (fromStatus === toStatus) return stats;

  const next = { ...stats };
  if (fromStatus === "active") next.active = Math.max(0, next.active - 1);
  if (fromStatus === "unsubscribed")
    next.unsubscribed = Math.max(0, next.unsubscribed - 1);
  if (fromStatus === "bounced") next.bounced = Math.max(0, next.bounced - 1);
  if (fromStatus === "pending") next.pending = Math.max(0, next.pending - 1);

  if (toStatus === "active") next.active += 1;
  if (toStatus === "unsubscribed") next.unsubscribed += 1;
  if (toStatus === "bounced") next.bounced += 1;
  if (toStatus === "pending") next.pending += 1;

  return next;
}

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const initialData = useStudioInitialData();
  const effectiveRole = initialData?.profile?.role ?? user?.role ?? null;
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingSubscriberId, setUpdatingSubscriberId] = useState<string | null>(
    null,
  );
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLoadingTimeout = () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  };

  const startLoadingTimeout = () => {
    clearLoadingTimeout();
    loadingTimeoutRef.current = setTimeout(() => {
      console.warn("⚠️ Loading timeout reached, stopping loading state");
      setLoading(false);
      toast.error("Loading timeout - please try refreshing the page");
    }, 30000);
  };

  const getCurrentQuery = (page: number): SubscriberQuery => ({
    page,
    limit: ITEMS_PER_PAGE,
    search: searchTerm,
    status: statusFilter !== "all" ? statusFilter : "",
    source: sourceFilter !== "all" ? sourceFilter : "",
  });

  // Check if user has access and fetch data
  useEffect(() => {
    if (!user && !initialData?.profile) {
      // User not loaded yet, keep loading
      return;
    }

    if (effectiveRole !== "super_admin") {
      toast.error(
        "Access denied. Only super admins can view newsletter subscriptions."
      );
      setLoading(false);
      return;
    }

    // User is super admin, fetch top-level stats once on auth-ready.
    console.log("🔄 Fetching subscriber stats for super admin:", user?.email);
    fetchStats();
  }, [user, initialData?.profile, effectiveRole]);

  // Fetch subscribers whenever current page changes (with applied filters).
  useEffect(() => {
    if (!effectiveRole || effectiveRole !== "super_admin") return;
    void fetchSubscribers(getCurrentQuery(currentPage));
  }, [currentPage, effectiveRole, user]);

  useEffect(() => {
    return () => {
      clearLoadingTimeout();
    };
  }, []);

  const fetchSubscribers = async (
    query: SubscriberQuery,
    retryCount = 0
  ): Promise<void> => {
    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff

    try {
      console.log(`🔄 Fetching subscribers (attempt ${retryCount + 1}/${maxRetries + 1})`);
      setLoading(true);
      startLoadingTimeout();

      const params = new URLSearchParams({
        page: query.page.toString(),
        limit: query.limit.toString(),
        search: query.search,
        status: query.status,
        source: query.source,
      });

      const response = await fetch(
        `/api/studio/newsletter/subscribers?${params}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(10000),
        }
      );

      console.log(`📊 Subscribers response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Subscribers fetch failed:`, errorText);
        
        if (response.status === 401 || response.status === 403) {
          throw new Error("You do not have permission to view subscribers.");
        }
        
        throw new Error(`Failed to fetch subscribers (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Subscribers fetched successfully:`, data);
      
      setSubscribers(data.subscribers || []);
      setTotalPages(Math.ceil((data.total || 0) / query.limit));
      
    } catch (error) {
      console.error(`❌ Error fetching subscribers (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying in ${retryDelay}ms...`);
        setTimeout(() => {
          void fetchSubscribers(query, retryCount + 1);
        }, retryDelay);
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch subscribers";
      toast.error(`Failed to fetch subscribers: ${errorMessage}`);
    } finally {
      setLoading(false);
      clearLoadingTimeout();
    }
  };

  const fetchStats = async (retryCount = 0): Promise<void> => {
    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff

    try {
      console.log(`📊 Fetching stats (attempt ${retryCount + 1}/${maxRetries + 1})`);

      const response = await fetch("/api/studio/newsletter/stats", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000),
      });

      console.log(`📊 Stats response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Stats fetch failed:`, errorText);
        throw new Error(`Failed to fetch stats (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Stats fetched successfully:`, data);
      setStats(data.stats);
      
    } catch (error) {
      console.error(`❌ Error fetching stats (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying stats fetch in ${retryDelay}ms...`);
        setTimeout(() => {
          fetchStats(retryCount + 1);
        }, retryDelay);
        return;
      }
      
      // Don't show toast for stats as it's not critical
      console.warn("Stats fetch failed after all retries, continuing without stats");
    }
  };

  const handleStatusChange = async (
    subscriberId: string,
    newStatus: NewsletterSubscriber["subscription_status"],
  ) => {
    const previous = subscribers.find((row) => row.id === subscriberId);
    if (!previous) return;
    const previousStats = stats;

    setUpdatingSubscriberId(subscriberId);
    setSubscribers((prev) =>
      prev.map((row) =>
        row.id === subscriberId
          ? {
              ...row,
              subscription_status: newStatus,
              unsubscribed_at:
                newStatus === "unsubscribed"
                  ? new Date().toISOString()
                  : null,
            }
          : row,
      ),
    );
    setStats((prev) =>
      prev
        ? applyStatusToStats(prev, previous.subscription_status, newStatus)
        : prev,
    );

    try {
      const response = await fetch(
        `/api/studio/newsletter/subscribers/${subscriberId}`,
        {
          method: "PATCH",
          cache: "no-store",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ subscription_status: newStatus }),
        }
      );

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Failed to update status",
        );
      }

      toast.success("Subscription status updated");
      void fetchStats();
    } catch (error) {
      setSubscribers((prev) =>
        prev.map((row) => (row.id === subscriberId ? previous : row)),
      );
      setStats(previousStats);
      console.error("Error updating status:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update subscription status",
      );
    } finally {
      setUpdatingSubscriberId(null);
    }
  };

  const handleDeleteSubscriber = async (subscriber: NewsletterSubscriber) => {
    const previousSubscribers = subscribers;
    const previousStats = stats;
    const wasLastOnPage = subscribers.length === 1 && currentPage > 1;

    setUpdatingSubscriberId(subscriber.id);
    setSubscribers((prev) => prev.filter((row) => row.id !== subscriber.id));
    setStats((prev) => (prev ? applyDeleteToStats(prev, subscriber) : prev));

    try {
      const response = await fetch(
        `/api/studio/newsletter/subscribers/${subscriber.id}`,
        {
          method: "DELETE",
          cache: "no-store",
          credentials: "include",
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Failed to delete subscriber",
        );
      }

      toast.success("Subscriber deleted");
      void fetchStats();
      if (wasLastOnPage) {
        setCurrentPage((page) => Math.max(1, page - 1));
      }
    } catch (error) {
      setSubscribers(previousSubscribers);
      setStats(previousStats);
      console.error("Error deleting subscriber:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete subscriber",
      );
    } finally {
      setUpdatingSubscriberId(null);
    }
  };

  const exportSubscribers = async () => {
    try {
      const response = await fetch("/api/studio/newsletter/export", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to export subscribers");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Subscribers exported successfully");
    } catch (error) {
      console.error("Error exporting subscribers:", error);
      toast.error("Failed to export subscribers");
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return (
        <Badge className="border-0 bg-oma-plum text-white hover:bg-oma-plum">
          Active
        </Badge>
      );
    }
    if (status === "unsubscribed") {
      return (
        <Badge variant="outline" className="text-oma-cocoa">
          Paused
        </Badge>
      );
    }
    if (status === "bounced") {
      return (
        <Badge variant="outline" className="border-red-200 text-red-700">
          Bounced
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-oma-cocoa">
        Pending
      </Badge>
    );
  };

  const sourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      website: "Website",
      contact_form: "Contact",
      studio_signup: "Studio",
      manual_import: "Import",
    };
    return labels[source] ?? source;
  };

  const displayName = (subscriber: NewsletterSubscriber) =>
    [subscriber.first_name, subscriber.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

  // Check access after user is loaded
  if (effectiveRole && effectiveRole !== "super_admin") {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            Only super admins can access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-1.5">
          <h1 className="font-canela text-3xl tracking-tight text-oma-plum sm:text-4xl">
            Newsletter Subscriptions
          </h1>
          <p className="text-sm leading-relaxed text-oma-cocoa sm:text-base">
            Manage and monitor newsletter subscribers across OmaHub.
          </p>
        </div>

        <Button
          onClick={exportSubscribers}
          variant="outline"
          className="w-full gap-2 border-oma-beige text-oma-cocoa hover:bg-oma-beige/40 sm:w-auto"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </header>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className={METRIC_CARD}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
              <CardTitle className="text-sm font-medium text-oma-cocoa">
                Total Subscribers
              </CardTitle>
              <Users className="h-4 w-4 text-oma-cocoa" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-2xl font-canela tabular-nums text-oma-plum">
                {stats.total}
              </div>
              <p className="text-xs text-oma-cocoa">
                {stats.growth > 0 ? "+" : ""}
                {stats.growth}% from last month
              </p>
            </CardContent>
          </Card>

          <Card className={METRIC_CARD}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
              <CardTitle className="text-sm font-medium text-oma-cocoa">
                Active Subscribers
              </CardTitle>
              <Mail className="h-4 w-4 text-oma-cocoa" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-2xl font-canela tabular-nums text-oma-plum">
                {stats.active}
              </div>
              <p className="text-xs text-oma-cocoa">
                {stats.total > 0
                  ? ((stats.active / stats.total) * 100).toFixed(1)
                  : "0.0"}
                % of total
              </p>
            </CardContent>
          </Card>

          <Card className={METRIC_CARD}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
              <CardTitle className="text-sm font-medium text-oma-cocoa">
                This Month
              </CardTitle>
              <Calendar className="h-4 w-4 text-oma-cocoa" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-2xl font-canela tabular-nums text-oma-plum">
                {stats.thisMonth}
              </div>
              <p className="text-xs text-oma-cocoa">New subscriptions this month</p>
            </CardContent>
          </Card>

          <Card className={METRIC_CARD}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
              <CardTitle className="text-sm font-medium text-oma-cocoa">
                Unsubscribed
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-oma-cocoa" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-2xl font-canela tabular-nums text-oma-plum">
                {stats.unsubscribed}
              </div>
              <p className="text-xs text-oma-cocoa">
                {stats.total > 0
                  ? ((stats.unsubscribed / stats.total) * 100).toFixed(1)
                  : "0.0"}
                % of total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className={DASHBOARD_SECTION}>
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-oma-cocoa" />
                <Input
                  placeholder="Search by email, name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-oma-beige bg-white pl-10 text-oma-black placeholder:text-oma-cocoa/70"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-oma-beige bg-white px-3 py-2 text-sm text-oma-black"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="unsubscribed">Unsubscribed</option>
                <option value="bounced">Bounced</option>
                <option value="pending">Pending</option>
              </select>

              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="rounded-md border border-oma-beige bg-white px-3 py-2 text-sm text-oma-black"
              >
                <option value="all">All Sources</option>
                <option value="website">Website</option>
                <option value="contact_form">Contact Form</option>
                <option value="studio_signup">Studio Signup</option>
                <option value="manual_import">Manual Import</option>
              </select>

              <Button
                onClick={() => {
                  const nextPage = 1;
                  setCurrentPage(nextPage);
                  if (currentPage === nextPage) {
                    void fetchSubscribers(getCurrentQuery(nextPage));
                  }
                }}
                className="flex items-center gap-2 bg-oma-plum hover:bg-oma-plum/90"
              >
                <Filter className="h-4 w-4" />
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscribers Table */}
      <Card className="overflow-hidden rounded-2xl border border-oma-beige/80 shadow-sm">
        <CardHeader className="border-b border-oma-beige/60 bg-oma-cream/20">
          <CardTitle className="font-canela text-2xl text-oma-plum">
            Subscribers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center">
              <div className="mx-auto h-8 w-8 rounded-full border-b-2 border-oma-plum"></div>
              <p className="mt-2 text-oma-cocoa">Loading subscribers…</p>
            </div>
          ) : subscribers.length === 0 ? (
            <div className="py-12 text-center">
              <Mail className="mx-auto mb-4 h-10 w-10 text-oma-cocoa/50" />
              <p className="text-oma-cocoa">No subscribers found</p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-oma-beige/70">
                {subscribers.map((subscriber) => {
                  const name = displayName(subscriber);
                  const subscribed = new Date(
                    subscriber.subscribed_at,
                  ).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const busy = updatingSubscriberId === subscriber.id;

                  return (
                    <li
                      key={subscriber.id}
                      className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium text-oma-black">
                            {subscriber.email}
                          </p>
                          {getStatusBadge(subscriber.subscription_status)}
                        </div>
                        <p className="mt-1 text-sm text-oma-cocoa">
                          {[
                            name || null,
                            sourceLabel(subscriber.source),
                            subscribed,
                            subscriber.email_count
                              ? `${subscriber.email_count} sent`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {subscriber.subscription_status === "active" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              void handleStatusChange(
                                subscriber.id,
                                "unsubscribed",
                              )
                            }
                            className="border-oma-beige text-oma-cocoa hover:bg-oma-beige/40"
                          >
                            Pause
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              void handleStatusChange(subscriber.id, "active")
                            }
                            className="border-oma-beige text-oma-plum hover:bg-oma-beige/40"
                          >
                            Restore
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              aria-label={`Delete ${subscriber.email}`}
                              className="border-red-200 text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete this subscriber?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {subscriber.email} will be removed from the
                                newsletter list. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() =>
                                  void handleDeleteSubscriber(subscriber)
                                }
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-oma-beige/60 px-5 py-4">
                  <div className="text-sm text-oma-cocoa">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
