"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

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

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Check if user has access and fetch data
  useEffect(() => {
    if (!user) {
      // User not loaded yet, keep loading
      return;
    }

    if (user.role !== "super_admin") {
      toast.error(
        "Access denied. Only super admins can view newsletter subscriptions."
      );
      setLoading(false);
      return;
    }

    // User is super admin, fetch data
    console.log("🔄 Fetching subscribers for super admin:", user.email);
    fetchSubscribers();
    fetchStats();

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn("⚠️ Loading timeout reached, stopping loading state");
        setLoading(false);
        toast.error("Loading timeout - please try refreshing the page");
      }
    }, 30000); // 30 second timeout

    setLoadingTimeout(timeout);

    // Cleanup timeout on unmount
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [user]);

  const fetchSubscribers = async (retryCount = 0): Promise<void> => {
    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff

    try {
      console.log(`🔄 Fetching subscribers (attempt ${retryCount + 1}/${maxRetries + 1})`);
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        status: statusFilter !== "all" ? statusFilter : "",
        source: sourceFilter !== "all" ? sourceFilter : "",
      });

      const response = await fetch(
        `/api/studio/newsletter/subscribers?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Add timeout
          signal: AbortSignal.timeout(10000), // 10 second timeout
        }
      );

      console.log(`📊 Subscribers response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Subscribers fetch failed:`, errorText);
        
        if (response.status === 401 || response.status === 403) {
          // Auth error - try to refresh session
          console.log("🔄 Auth error, attempting session refresh...");
          window.location.reload();
          return;
        }
        
        throw new Error(`Failed to fetch subscribers (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Subscribers fetched successfully:`, data);
      
      setSubscribers(data.subscribers || []);
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      
      // Clear timeout on successful load
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }
      
    } catch (error) {
      console.error(`❌ Error fetching subscribers (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying in ${retryDelay}ms...`);
        setTimeout(() => {
          fetchSubscribers(retryCount + 1);
        }, retryDelay);
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch subscribers";
      toast.error(`Failed to fetch subscribers: ${errorMessage}`);
    } finally {
      setLoading(false);
      // Clear timeout when loading completes (success or failure)
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }
    }
  };

  const fetchStats = async (retryCount = 0): Promise<void> => {
    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff

    try {
      console.log(`📊 Fetching stats (attempt ${retryCount + 1}/${maxRetries + 1})`);

      const response = await fetch("/api/studio/newsletter/stats", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
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
    newStatus: string
  ) => {
    try {
      const response = await fetch(
        `/api/studio/newsletter/subscribers/${subscriberId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ subscription_status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      toast.success("Subscription status updated successfully");
      fetchSubscribers(); // Refresh the list
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update subscription status");
    }
  };

  const exportSubscribers = async () => {
    try {
      const response = await fetch("/api/studio/newsletter/export");

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
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", label: "Active" },
      unsubscribed: { color: "bg-red-100 text-red-800", label: "Unsubscribed" },
      bounced: { color: "bg-yellow-100 text-yellow-800", label: "Bounced" },
      pending: { color: "bg-blue-100 text-blue-800", label: "Pending" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getSourceBadge = (source: string) => {
    const sourceConfig = {
      website: { color: "bg-blue-100 text-blue-800", label: "Website" },
      contact_form: {
        color: "bg-purple-100 text-purple-800",
        label: "Contact Form",
      },
      studio_signup: {
        color: "bg-indigo-100 text-indigo-800",
        label: "Studio Signup",
      },
      manual_import: {
        color: "bg-gray-100 text-gray-800",
        label: "Manual Import",
      },
    };

    const config =
      sourceConfig[source as keyof typeof sourceConfig] || sourceConfig.website;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // Check access after user is loaded
  if (user && !loading && user.role !== "super_admin") {
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
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-oma-plum mb-2">
            Newsletter Subscriptions
          </h1>
          <p className="text-oma-cocoa">
            Manage and monitor newsletter subscribers
          </p>
        </div>

        <div className="flex gap-3 mt-4 lg:mt-0">
          <Button
            onClick={exportSubscribers}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => {
              console.log("🔄 Manual refresh triggered");
              fetchSubscribers();
              fetchStats();
            }}
            className="flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-black">
                Total Subscribers
              </CardTitle>
              <Users className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{stats.total}</div>
              <p className="text-xs text-black">
                {stats.growth > 0 ? "+" : ""}
                {stats.growth}% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-black">
                Active Subscribers
              </CardTitle>
              <Mail className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {stats.active}
              </div>
              <p className="text-xs text-black">
                {((stats.active / stats.total) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-black">
                This Month
              </CardTitle>
              <Calendar className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {stats.thisMonth}
              </div>
              <p className="text-xs text-black">New subscriptions this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-black">
                Unsubscribed
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {stats.unsubscribed}
              </div>
              <p className="text-xs text-black">
                {((stats.unsubscribed / stats.total) * 100).toFixed(1)}% of
                total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-black" />
                <Input
                  placeholder="Search by email, name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-black placeholder:text-black/60"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input rounded-md text-sm text-black bg-white"
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
                className="px-3 py-2 border border-input rounded-md text-sm text-black bg-white"
              >
                <option value="all">All Sources</option>
                <option value="website">Website</option>
                <option value="contact_form">Contact Form</option>
                <option value="studio_signup">Studio Signup</option>
                <option value="manual_import">Manual Import</option>
              </select>

              <Button
                onClick={() => {
                  setCurrentPage(1);
                  fetchSubscribers();
                }}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscribers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-black">Subscribers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-oma-plum mx-auto"></div>
              <p className="mt-2 text-black">Loading subscribers...</p>
            </div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-black mx-auto mb-4" />
              <p className="text-black">No subscribers found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-black">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-black">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-black">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-black">
                        Source
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-black">
                        Subscribed
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-black">
                        Emails Sent
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-black">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((subscriber) => (
                      <tr
                        key={subscriber.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-black">
                            {subscriber.email}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {subscriber.first_name || subscriber.last_name ? (
                            <div className="text-black">
                              {subscriber.first_name} {subscriber.last_name}
                            </div>
                          ) : (
                            <span className="text-black">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(subscriber.subscription_status)}
                        </td>
                        <td className="py-3 px-4">
                          {getSourceBadge(subscriber.source)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-black">
                            {new Date(
                              subscriber.subscribed_at
                            ).toLocaleDateString("en-GB")}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-black">
                            {subscriber.email_count}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {subscriber.subscription_status === "active" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStatusChange(
                                    subscriber.id,
                                    "unsubscribed"
                                  )
                                }
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                Unsubscribe
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStatusChange(subscriber.id, "active")
                                }
                                className="text-green-600 border-green-200 hover:bg-green-50"
                              >
                                Reactivate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-black">
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
