"use client";

import { useState, useEffect, useRef } from "react";
import {
  useLeads,
  useLeadsAnalytics,
  useLeadMutations,
  type Lead,
  type LeadsAnalytics,
} from "@/hooks/useLeads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase-unified";
import Link from "next/link";
import { RefreshCw, Star, Edit2, Check, X } from "lucide-react";
import {
  getAnalyticsData,
  getBrandGrowthData,
  getReviewTrendsData,
  getBrandOwnerAnalyticsData,
  getBrandOwnerGrowthData,
  getBrandOwnerReviewTrends,
  syncBrandRatings,
  type AnalyticsData,
  detectAnalyticsSource,
} from "@/lib/services/analyticsService";
import PageViewsCard from "./PageViewsCard";

const COLORS = ["#6B46C1", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6"]; // OmaHub color palette: plum, amber, emerald, red, violet

const statusColors = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-purple-100 text-purple-800",
  converted: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
  closed: "bg-gray-100 text-gray-800",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  normal: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

// Session Debug Component
function SessionDebugInfo() {
  const { user, session } = useAuth();
  const [supabaseSession, setSupabaseSession] = useState<any>(null);
  const [lastCheck, setLastCheck] = useState(0);

  useEffect(() => {
    const now = Date.now();
    // Only check Supabase session every 10 seconds to prevent excessive calls
    if (now - lastCheck < 10000) return;

    const checkSupabaseSession = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSupabaseSession(session);
        setLastCheck(now);
      } catch (error) {
        console.error("Error checking Supabase session:", error);
      }
    };

    checkSupabaseSession();
  }, [user?.email, lastCheck]); // Only re-check when user email changes or after interval

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-blue-800 mb-2">
        Debug: Authentication Status
      </h4>
      <div className="text-sm space-y-1">
        <p>
          <strong>Auth Context User:</strong>{" "}
          {user ? `${user.email} (${user.role})` : "None"}
        </p>
        <p>
          <strong>Auth Context Session:</strong> {session ? "Found" : "None"}
        </p>
        <p>
          <strong>Supabase Session:</strong>{" "}
          {supabaseSession ? `${supabaseSession.user?.email}` : "None"}
        </p>
        <p>
          <strong>Session Expires:</strong>{" "}
          {supabaseSession?.expires_at
            ? new Date(supabaseSession.expires_at * 1000).toLocaleString()
            : "N/A"}
        </p>
        <p className="text-xs text-gray-500">
          Last checked: {new Date(lastCheck).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

interface LeadsTrackingDashboardProps {
  userRole?: string;
  ownedBrandIds?: string[];
}

export default function LeadsTrackingDashboard({
  userRole,
  ownedBrandIds = [],
}: LeadsTrackingDashboardProps) {
  const { user, loading: authLoading } = useAuth();
  const [filters, setFilters] = useState<{
    brand_id: string;
    status: Lead["status"] | "";
    source: Lead["source"] | "";
    search: string;
    limit: number;
    offset: number;
  }>({
    brand_id: "",
    status: "",
    source: "",
    search: "",
    limit: 10,
    offset: 0,
  });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [analytics, setAnalytics] = useState<LeadsAnalytics | null>(null);
  const [platformAnalytics, setPlatformAnalytics] =
    useState<AnalyticsData | null>(null);
  const [brandOwnerAnalytics, setBrandOwnerAnalytics] = useState<{
    totalBrands: number;
    totalProducts: number;
    totalReviews: number;
    averageRating: number;
    recentReviews: number;
  } | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [platformLoading, setPlatformLoading] = useState(true);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [platformError, setPlatformError] = useState<string | null>(null);
  // Google Analytics state variables - commented out for future use
  // const [vercelAnalytics, setVercelAnalytics] = useState<any>(null);
  // const [vercelLoading, setVercelLoading] = useState(true);
  // const [vercelError, setVercelError] = useState<string | null>(null);

  // Inline editing states
  const [updatingLead, setUpdatingLead] = useState<string | null>(null);

  const { updateLead } = useLeadMutations();

  // Determine user access level - only after authentication is complete
  const isSuperAdmin =
    !authLoading &&
    (user?.role === "super_admin" || userRole === "super_admin");
  const isBrandAdmin =
    !authLoading &&
    (user?.role === "brand_admin" || userRole === "brand_admin");
  const effectiveOwnedBrands = !authLoading
    ? ownedBrandIds.length > 0
      ? ownedBrandIds
      : user?.owned_brands || []
    : [];

  const fetchLeads = async () => {
    try {
      setLeadsLoading(true);
      setLeadsError(null);

      const response = await fetch(`/api/leads?action=list&_t=${Date.now()}`, {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch leads");
      }

      const data = await response.json();
      let filteredLeads = data.leads || [];
      if (isBrandAdmin && effectiveOwnedBrands.length > 0) {
        filteredLeads = filteredLeads.filter((lead: Lead) =>
          effectiveOwnedBrands.includes(lead.brand_id)
        );
      }
      setLeads(filteredLeads);
      setTotalCount(data.total);
      setTotalPages(Math.ceil(data.total / filters.limit));
    } catch (error) {
      console.error("Leads fetch error:", error);
      setLeadsError(
        error instanceof Error ? error.message : "Failed to fetch leads"
      );
    } finally {
      setLeadsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError(null);

      const response = await fetch(`/api/leads?action=analytics&_t=${Date.now()}`, {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch analytics");
      }

      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (error) {
      console.error("Analytics fetch error:", error);
      setAnalyticsError(
        error instanceof Error ? error.message : "Failed to fetch analytics"
      );
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchPlatformAnalytics = async () => {
    try {
      setPlatformLoading(true);
      setPlatformError(null);

      if (isSuperAdmin) {
        // Super admins get platform-wide analytics
        const platformData = await getAnalyticsData();
        setPlatformAnalytics(platformData);
      } else if (isBrandAdmin && effectiveOwnedBrands.length > 0) {
        // Brand owners get their brand-specific analytics
        const apiUrl = `/api/admin/brand-analytics?brand_ids=${effectiveOwnedBrands.join(",")}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Brand analytics API error:", {
            status: response.status,
            statusText: response.statusText,
            errorText,
          });
          throw new Error(
            `Failed to fetch brand analytics: ${response.status} ${response.statusText}`
          );
        }

        const brandData = await response.json();
        setBrandOwnerAnalytics(brandData);
      } else {
        // No analytics to fetch
      }
    } catch (error) {
      console.error("❌ Platform analytics fetch error:", error);
      setPlatformError(
        error instanceof Error
          ? error.message
          : "Failed to fetch platform analytics"
      );
    } finally {
      setPlatformLoading(false);
    }
  };

  const refetchAnalytics = () => {
    fetchAnalytics();
    fetchPlatformAnalytics();
  };

  // Debug logging - throttle to prevent spam
  const lastLogTime = useRef(0);
  useEffect(() => {
    // Only log in development mode
    if (process.env.NODE_ENV === "development") {
      const now = Date.now();
      if (now - lastLogTime.current > 5000) {
        // Log every 5 seconds max
        console.log("🔍 LeadsTrackingDashboard Debug:", {
          user: user?.email,
          userRole,
          ownedBrandIds,
          effectiveOwnedBrands: effectiveOwnedBrands,
          isBrandAdmin,
          isSuperAdmin,
          authLoading,
          leadsLoading,
          analyticsLoading,
          leadsCount: leads?.length,
          totalCount,
          brandOwnerAnalytics,
          analyticsData: analytics
            ? {
                total_leads: analytics.total_leads,
                qualified_leads: analytics.qualified_leads,
                conversion_rate: analytics.conversion_rate,
              }
            : null,
        });
        lastLogTime.current = now;
      }
    }
  }, [
    user,
    userRole,
    ownedBrandIds,
    effectiveOwnedBrands,
    isBrandAdmin,
    isSuperAdmin,
    authLoading,
    leadsLoading,
    analyticsLoading,
    leads?.length,
    totalCount,
    brandOwnerAnalytics,
    analytics?.total_leads,
    analytics?.qualified_leads,
    analytics?.conversion_rate,
    analytics?.total_bookings,
  ]);

  useEffect(() => {
    if (user) {
      fetchLeads();
      fetchAnalytics();

      // Only fetch platform analytics if we have the necessary data
      if (isSuperAdmin || (isBrandAdmin && effectiveOwnedBrands.length > 0)) {
        fetchPlatformAnalytics();
      }
    }
  }, [user, currentPage, filters, effectiveOwnedBrands.length]); // Add effectiveOwnedBrands.length as dependency

  // Additional effect to fetch analytics when ownedBrandIds become available
  useEffect(() => {
    if (user && isBrandAdmin && effectiveOwnedBrands.length > 0) {
      console.log(
        "🏷️ Brand owner analytics: Owned brands now available, fetching analytics:",
        effectiveOwnedBrands
      );
      fetchPlatformAnalytics();
    }
  }, [user, isBrandAdmin, effectiveOwnedBrands.length]);

  // Fallback: Periodic refresh to ensure data stays in sync
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      console.log("🔄 Periodic refresh: updating dashboard data");
      fetchLeads();
      fetchAnalytics();
      if (isSuperAdmin || (isBrandAdmin && effectiveOwnedBrands.length > 0)) {
        fetchPlatformAnalytics();
      }
    }, 30000); // Refresh every 30 seconds as fallback

    return () => clearInterval(interval);
  }, [user, isSuperAdmin, isBrandAdmin, effectiveOwnedBrands.length]);

  // Listen for lead deletion and update events to refresh data in real-time
  useEffect(() => {
    const handleLeadDeleted = (event: any) => {
      const { leadId, leadName } = event.detail || {};
      console.log("🔄 Lead deleted event received:", { leadId, leadName });
      console.log("🔄 Refreshing dashboard data...");
      
      // Remove the deleted lead from local state immediately for better UX
      setLeads((prevLeads) => {
        const newLeads = prevLeads.filter(lead => lead.id !== leadId);
        console.log(`🔄 Updated local leads state: ${prevLeads.length} → ${newLeads.length} leads`);
        return newLeads;
      });
      
      // Add a small delay to ensure database has been updated, then refresh all data
      setTimeout(() => {
        fetchLeads();
        fetchAnalytics();
        if (isSuperAdmin || (isBrandAdmin && effectiveOwnedBrands.length > 0)) {
          fetchPlatformAnalytics();
        }
        console.log("✅ Dashboard data refreshed after lead deletion");
      }, 100);
    };

    const handleLeadUpdated = (event: any) => {
      const { leadId, newStatus } = event.detail || {};
      console.log("🔄 Lead updated event received:", { leadId, newStatus });
      console.log("🔄 Refreshing dashboard data...");
      
      // Refresh all data immediately
      fetchLeads();
      fetchAnalytics();
      if (isSuperAdmin || (isBrandAdmin && effectiveOwnedBrands.length > 0)) {
        fetchPlatformAnalytics();
      }
      
      console.log("✅ Dashboard data refreshed after lead update");
    };

    console.log("🎧 Setting up event listeners for leadDeleted and leadUpdated");
    window.addEventListener("leadDeleted", handleLeadDeleted);
    window.addEventListener("leadUpdated", handleLeadUpdated);

    return () => {
      console.log("🎧 Cleaning up event listeners");
      window.removeEventListener("leadDeleted", handleLeadDeleted);
      window.removeEventListener("leadUpdated", handleLeadUpdated);
    };
  }, [isSuperAdmin, isBrandAdmin, effectiveOwnedBrands.length]);

  // Handle inline field updates
  const handleFieldUpdate = async (
    leadId: string,
    field: string,
    value: string | number
  ) => {
    setUpdatingLead(leadId);
    try {
      const response = await fetch("/api/leads", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id: leadId,
          data: {
            [field]: value,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update lead");
      }

      const { lead: updatedLead } = await response.json();

      // Update local state
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead.id === leadId ? { ...lead, ...updatedLead } : lead
        )
      );

      toast.success(`${field.replace("_", " ")} updated successfully`);
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error(`Failed to update ${field.replace("_", " ")}`);
    } finally {
      setUpdatingLead(null);
    }
  };

  // Handle status change
  const handleStatusChange = async (
    leadId: string,
    newStatus: Lead["status"]
  ) => {
    await handleFieldUpdate(leadId, "status", newStatus);
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading authentication...</p>
      </div>
    );
  }

  // Show authentication required state
  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="text-center">
          <h3 className="text-yellow-800 font-semibold text-lg mb-2">
            Authentication Required
          </h3>
          <p className="text-yellow-700 mb-4">
            You need to be logged in to view the leads dashboard.
          </p>
          <Link href="/login">
            <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show error states
  if (leadsError || analyticsError) {
    return (
      <div className="space-y-4">
        <SessionDebugInfo />

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">
            Error Loading Leads Dashboard
          </h3>
          {leadsError && (
            <p className="text-red-600 text-sm mt-1">
              Leads Error: {leadsError}
            </p>
          )}
          {analyticsError && (
            <p className="text-red-600 text-sm mt-1">
              Analytics Error: {analyticsError}
            </p>
          )}
          <div className="mt-3 space-x-2">
            <Button onClick={fetchLeads} variant="outline" size="sm">
              Retry Leads
            </Button>
            <Button onClick={refetchAnalytics} variant="outline" size="sm">
              Retry Analytics
            </Button>
            <Link href="/login">
              <Button variant="outline" size="sm">
                Re-login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (leadsLoading || analyticsLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </Card>
          ))}
        </div>
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leads dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Debug info in development */}
      {process.env.NODE_ENV === "development" && <SessionDebugInfo />}

      {/* Platform Overview Section - Super Admin Only */}
      {isSuperAdmin && (
        <div className="bg-gradient-to-r from-oma-plum/5 to-oma-beige/10 rounded-lg p-6 border border-oma-beige">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-canela text-oma-plum">
                Platform Overview
              </h2>
              <p className="text-oma-cocoa">
                Key metrics across the entire OmaHub platform
              </p>
            </div>
            <Button
              onClick={refetchAnalytics}
              variant="outline"
              size="sm"
              className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {platformLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : platformError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">
                Platform Analytics Error: {platformError}
              </p>
              <Button
                onClick={fetchPlatformAnalytics}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Retry Platform Analytics
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="p-4 border-l-4 border-l-oma-plum">
                <h3 className="text-sm font-medium text-oma-cocoa">
                  Total Brands
                </h3>
                <p className="text-2xl font-canela text-oma-plum">
                  {platformAnalytics?.totalBrands || 0}
                </p>
                <p className="text-sm text-oma-cocoa">
                  {platformAnalytics?.verifiedBrands || 0} verified
                </p>
              </Card>
              <Card className="p-4 border-l-4 border-l-oma-beige">
                <h3 className="text-sm font-medium text-oma-cocoa">
                  Total Products
                </h3>
                <p className="text-2xl font-canela text-oma-plum">
                  {platformAnalytics?.totalProducts || 0}
                </p>
                <p className="text-sm text-oma-cocoa">Across all brands</p>
              </Card>
              <Card className="p-4 border-l-4 border-l-green-500">
                <h3 className="text-sm font-medium text-oma-cocoa">
                  Total Reviews
                </h3>
                <p className="text-2xl font-canela text-oma-plum">
                  {platformAnalytics?.totalReviews || 0}
                </p>
                <p className="text-sm text-oma-cocoa">
                  {platformAnalytics?.recentReviews || 0} this month
                </p>
              </Card>
              <Card className="p-4 border-l-4 border-l-blue-500">
                <PageViewsCard
                  totalBrands={platformAnalytics?.totalBrands || 0}
                  totalReviews={platformAnalytics?.totalReviews || 0}
                  totalProducts={platformAnalytics?.totalProducts || 0}
                />
              </Card>
              <Card className="p-4 border-l-4 border-l-purple-500">
                <h3 className="text-sm font-medium text-oma-cocoa">
                  Avg Rating
                </h3>
                <p className="text-2xl font-canela text-oma-plum flex items-center">
                  {platformAnalytics?.averageRating?.toFixed(1) || "0.0"}
                  <Star className="h-5 w-5 text-yellow-400 ml-1 fill-current" />
                </p>
                <p className="text-sm text-oma-cocoa">Platform average</p>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Brand Overview Section - Brand Admin Only */}
      {authLoading ? (
        <div className="bg-gradient-to-r from-oma-plum/5 to-oma-beige/10 rounded-lg p-6 border border-oma-beige">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-canela text-oma-plum">
                Your Brand Overview
              </h2>
              <p className="text-oma-cocoa">Loading brand information...</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : isBrandAdmin ? (
        <div className="bg-gradient-to-r from-oma-plum/5 to-oma-beige/10 rounded-lg p-6 border border-oma-beige">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-canela text-oma-plum">
                Your Brand Overview
              </h2>
              <p className="text-oma-cocoa">
                Key metrics for your{" "}
                {effectiveOwnedBrands.length > 1 ? "brands" : "brand"}
              </p>
            </div>
            <Button
              onClick={refetchAnalytics}
              variant="outline"
              size="sm"
              className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {platformLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : platformError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">
                Brand Analytics Error: {platformError}
              </p>
              <Button
                onClick={fetchPlatformAnalytics}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Retry Brand Analytics
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 border-l-4 border-l-oma-plum">
                <h3 className="text-sm font-medium text-oma-cocoa">
                  Your Brands
                </h3>
                <p className="text-2xl font-canela text-oma-plum">
                  {brandOwnerAnalytics?.totalBrands ||
                    effectiveOwnedBrands.length}
                </p>
                <p className="text-sm text-oma-cocoa">
                  {effectiveOwnedBrands.length > 1
                    ? "Brands owned"
                    : "Brand owned"}
                </p>
              </Card>
              <Card className="p-4 border-l-4 border-l-oma-beige">
                <h3 className="text-sm font-medium text-oma-cocoa">
                  Total Products
                </h3>
                <p className="text-2xl font-canela text-oma-plum">
                  {brandOwnerAnalytics?.totalProducts || 0}
                </p>
                <p className="text-sm text-oma-cocoa">
                  Across your{" "}
                  {effectiveOwnedBrands.length > 1 ? "brands" : "brand"}
                </p>
              </Card>
              <Card className="p-4 border-l-4 border-l-green-500">
                <h3 className="text-sm font-medium text-oma-cocoa">
                  Total Reviews
                </h3>
                <p className="text-2xl font-canela text-oma-plum">
                  {brandOwnerAnalytics?.totalReviews || 0}
                </p>
                <p className="text-sm text-oma-cocoa">
                  {brandOwnerAnalytics?.recentReviews || 0} this month
                </p>
              </Card>
              <Card className="p-4 border-l-4 border-l-purple-500">
                <h3 className="text-sm font-medium text-oma-cocoa">
                  Avg Rating
                </h3>
                <p className="text-2xl font-canela text-oma-plum flex items-center">
                  {brandOwnerAnalytics?.averageRating?.toFixed(1) || "0.0"}
                  <Star className="h-5 w-5 text-yellow-400 ml-1 fill-current" />
                </p>
                <p className="text-sm text-oma-cocoa">
                  Your {effectiveOwnedBrands.length > 1 ? "brands" : "brand"}{" "}
                  average
                </p>
              </Card>
            </div>
          )}
        </div>
      ) : null}

      {/* Leads Analytics Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-canela text-oma-plum">
            Leads & Bookings Analytics
          </h2>
          <div className="flex items-center gap-2">
            {analyticsLoading && (
              <div className="flex items-center gap-2 text-sm text-oma-cocoa">
                <div className="animate-spin h-4 w-4 border-2 border-oma-plum border-t-transparent rounded-full"></div>
                Loading analytics...
              </div>
            )}
            {!analyticsLoading && analytics && (
              <div className="text-sm text-green-600">
                ✓ Data loaded successfully
              </div>
            )}
            {!analyticsLoading && !analytics && (
              <div className="text-sm text-amber-600">
                ⚠ No analytics data available
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-l-oma-plum border-oma-beige">
            <h3 className="text-sm font-medium text-oma-cocoa">Total Leads</h3>
            <p className="text-2xl font-canela text-oma-plum">
              {analytics?.total_leads || 0}
            </p>
            <p className="text-sm text-oma-cocoa">
              This month: {analytics?.this_month_leads || 0}
            </p>
          </Card>
          <Card className="p-4 border-l-4 border-l-oma-beige border-oma-beige">
            <h3 className="text-sm font-medium text-oma-cocoa">
              Qualified Leads
            </h3>
            <p className="text-2xl font-canela text-oma-plum">
              {analytics?.qualified_leads || 0}
            </p>
            <p className="text-sm text-oma-cocoa">Ready for follow-up</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-emerald-500 border-oma-beige">
            <h3 className="text-sm font-medium text-oma-cocoa">
              Conversion Rate
            </h3>
            <p className="text-2xl font-canela text-oma-plum">
              {analytics?.conversion_rate || 0}%
            </p>
            <p className="text-sm text-oma-cocoa">
              Converted: {analytics?.converted_leads || 0}
            </p>
          </Card>
          <Card className="p-4 border-l-4 border-l-amber-500 border-oma-beige">
            <h3 className="text-sm font-medium text-oma-cocoa">
              Total Bookings
            </h3>
            <p className="text-2xl font-canela text-oma-plum">
              {analytics?.total_bookings || 0}
            </p>
            <p className="text-sm text-oma-cocoa">
              This month: {analytics?.this_month_bookings || 0}
            </p>
          </Card>
        </div>

        {/* No Data Message */}
        {!analyticsLoading && analytics && analytics.total_leads === 0 && (
          <Card className="p-4 border-l-4 border-l-amber-500 border-amber-200 bg-amber-50 mt-4">
            <h3 className="text-sm font-medium text-amber-800 mb-2">
              No Data Available
            </h3>
            <p className="text-sm text-amber-700">
              The dashboard is showing zeros because there are no leads or
              bookings in the system yet. This is normal for a new installation.
              Data will appear here once leads are created or the leads tracking
              system is set up.
            </p>
          </Card>
        )}

        {/* Analytics Error Display */}
        {analyticsError && (
          <Card className="p-4 border-l-4 border-l-red-500 border-red-200 bg-red-50 mt-4">
            <h3 className="text-sm font-medium text-red-800 mb-2">
              Analytics Error
            </h3>
            <p className="text-sm text-red-700 mb-3">{analyticsError}</p>
            <Button
              onClick={refetchAnalytics}
              variant="outline"
              size="sm"
              disabled={analyticsLoading}
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              {analyticsLoading ? "Retrying..." : "Retry Analytics"}
            </Button>
          </Card>
        )}
      </div>

      {/* Charts Section - REMOVED */}
      {/* 
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>Leads by Source Chart - REMOVED</div>
        <div>Revenue Metrics - REMOVED</div>
      </div>
      */}

      {/* Debug Information (Development Only) */}
      {process.env.NODE_ENV === "development" && (
        <Card className="p-6 border-oma-beige mb-8">
          <h3 className="text-lg font-canela text-oma-plum mb-4">
            Debug Information
          </h3>
          <div className="space-y-2 text-sm">
            <p>
              <strong>User Role:</strong> {user?.role || "Unknown"}
            </p>
            <p>
              <strong>Analytics Loading:</strong>{" "}
              {analyticsLoading ? "Yes" : "No"}
            </p>
            <p>
              <strong>Analytics Error:</strong> {analyticsError || "None"}
            </p>
            <p>
              <strong>Total Leads:</strong> {analytics?.total_leads || 0}
            </p>
            <p>
              <strong>Leads Data:</strong> {leads?.length || 0} leads loaded
            </p>
            <p>
              <strong>Owned Brands:</strong> {effectiveOwnedBrands.length}
            </p>
            <p>
              <strong>API Status:</strong>{" "}
              {analytics ? "Data loaded" : "No data"}
            </p>
          </div>
          <div className="mt-4">
            <Button
              onClick={refetchAnalytics}
              variant="outline"
              size="sm"
              disabled={analyticsLoading}
            >
              {analyticsLoading ? "Refreshing..." : "Refresh Analytics"}
            </Button>
          </div>
        </Card>
      )}

      {/* Top Performing Brands (Super Admin Only) */}
      {isSuperAdmin &&
        analytics?.top_performing_brands &&
        analytics.top_performing_brands.length > 0 && (
          <Card className="p-6 border-oma-beige">
            <h3 className="text-lg font-canela text-oma-plum mb-4">
              Top Performing Brands
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-oma-beige">
                    <th className="text-left py-2 font-medium text-oma-cocoa">
                      Brand
                    </th>
                    <th className="text-right py-2 font-medium text-oma-cocoa">
                      Total Revenue
                    </th>
                    <th className="text-right py-2 font-medium text-oma-cocoa">
                      Commission Earned
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.top_performing_brands.map((brand, index) => (
                    <tr
                      key={brand.brand_id}
                      className="border-b border-oma-beige"
                    >
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          ></div>
                          <span className="text-oma-cocoa">
                            {brand.brand_name}
                          </span>
                        </div>
                      </td>
                      <td className="text-right py-2 font-canela text-oma-plum">
                        {formatCurrency(brand.total_revenue)}
                      </td>
                      <td className="text-right py-2 font-canela text-green-600">
                        {formatCurrency(brand.total_commission)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

      {/* Leads Table */}
      <Card className="border-oma-beige">
        <CardHeader className="bg-oma-cream/30">
          <div className="flex justify-between items-center">
            <CardTitle className="font-canela text-oma-plum">
              Recent Leads
            </CardTitle>
            <div className="text-sm text-oma-cocoa">
              Showing {leads.length} of {totalCount} leads
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-oma-cream/20 border-b border-oma-beige">
                <tr>
                  <th className="text-left p-4 font-medium text-oma-cocoa">
                    Customer
                  </th>
                  <th className="text-left p-4 font-medium text-oma-cocoa">
                    Brand
                  </th>
                  <th className="text-left p-4 font-medium text-oma-cocoa">
                    Source
                  </th>
                  <th className="text-left p-4 font-medium text-oma-cocoa">
                    Type
                  </th>
                  <th className="text-left p-4 font-medium text-oma-cocoa">
                    Status
                  </th>
                  <th className="text-left p-4 font-medium text-oma-cocoa">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-oma-beige hover:bg-oma-cream/10 group"
                  >
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-oma-plum">
                          {lead.customer_name}
                        </div>
                        <div className="text-sm text-oma-cocoa">
                          {lead.customer_email}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-oma-cocoa">
                        {lead.brands?.name || "Unknown Brand"}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className="capitalize border-oma-beige text-oma-cocoa"
                      >
                        {lead.source}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className="capitalize border-oma-beige text-oma-cocoa"
                      >
                        {lead.lead_type?.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Select
                        value={lead.status}
                        onValueChange={(value) =>
                          handleStatusChange(lead.id!, value as Lead["status"])
                        }
                        disabled={updatingLead === lead.id}
                      >
                        <SelectTrigger className="w-32 border-oma-beige">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-oma-cocoa">
                        {new Date(lead.created_at!).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t border-oma-beige bg-oma-cream/10">
              <div className="text-sm text-oma-cocoa">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="border-oma-beige text-oma-cocoa hover:bg-oma-plum hover:text-white"
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
                  className="border-oma-beige text-oma-cocoa hover:bg-oma-plum hover:text-white"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Analytics Section - Super Admin Only - Commented out for future use */}
      {/* {isSuperAdmin && (
        <Card className="border-oma-beige mt-6">
          <CardHeader className="bg-oma-cream/30">
            <div className="flex justify-between items-center">
              <CardTitle className="font-canela text-oma-plum">
                Google Analytics Overview
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-oma-beige text-oma-cocoa"
                >
                  Super Admin Only
                </Badge>
                <Badge
                  variant={
                    vercelAnalytics?.source === "vercel"
                      ? "default"
                      : "secondary"
                  }
                  className={
                    vercelAnalytics?.source === "vercel"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }
                >
                  {vercelAnalytics?.source === "vercel"
                    ? "Real Data"
                    : "Estimated Data"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Data Source Info */}
      {/* {vercelAnalytics?.source !== "vercel" && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">
                    {vercelAnalytics?.message || "Analytics not configured. Showing estimated data based on platform metrics."}
                  </span>
                </div>
                <p className="text-xs text-yellow-700 mt-1 ml-6">
                  To see real analytics data, enable Vercel Analytics in your project dashboard.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Page Views */}
      {/* <div className="text-center p-4 bg-oma-cream/20 rounded-lg border border-oma-beige">
                <div className="text-2xl font-bold text-oma-plum">
                  {vercelAnalytics?.pageviews?.toLocaleString() ||
                    platformAnalytics?.totalPageViews?.toLocaleString() ||
                    "1,247"}
                </div>
                <div className="text-sm text-oma-cocoa font-medium">
                  Total Page Views
                </div>
                <div className="text-xs text-oma-cocoa/70 mt-1">
                  Last 30 days
                </div>
              </div>

              {/* Unique Visitors */}
      {/* <div className="text-center p-4 bg-oma-cream/20 rounded-lg border border-oma-beige">
                <div className="text-2xl font-bold text-oma-plum">
                  {vercelAnalytics?.visitors?.toLocaleString() || "342"}
                </div>
                <div className="text-sm text-oma-cocoa font-medium">
                  Unique Visitors
                </div>
                <div className="text-xs text-oma-cocoa/70 mt-1">
                  Last 30 days
                </div>
              </div>

              {/* Conversion Rate */}
      {/* <div className="text-center p-4 bg-oma-cream/20 rounded-lg border border-oma-beige">
                <div className="text-2xl font-bold text-oma-plum">
                  {analytics?.conversion_rate
                    ? `${(analytics.conversion_rate * 100).toFixed(1)}%`
                    : "0%"}
                </div>
                <div className="text-sm text-oma-cocoa font-medium">
                  Conversion Rate
                </div>
                <div className="text-xs text-oma-cocoa/70 mt-1">
                  Leads to Conversion
                </div>
              </div>

              {/* Top Performing Page */}
      {/* <div className="text-center p-4 bg-oma-cream/20 rounded-lg border border-oma-beige">
                <div className="text-lg font-bold text-oma-plum truncate">
                  {vercelAnalytics?.top_page || "Directory"}
                </div>
                <div className="text-sm text-oma-cocoa font-medium">
                  Top Page
                </div>
                <div className="text-xs text-oma-cocoa/70 mt-1">
                  Most Visited
                </div>
              </div>
            </div>

            {/* Traffic Sources */}
      {/* <div className="mt-6">
              <h4 className="font-medium text-oma-plum mb-3">
                Traffic Sources
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {vercelAnalytics?.sources &&
                Object.keys(vercelAnalytics.sources).length > 0 ? (
                  Object.entries(vercelAnalytics.sources).map(
                    ([source, count]) => (
                      <div
                        key={source}
                        className="text-center p-3 bg-oma-cream/10 rounded-lg border border-oma-beige"
                      >
                        <div className="text-lg font-semibold text-oma-cocoa">
                          {count?.toLocaleString() || "0"}
                        </div>
                        <div className="text-xs text-oma-cocoa/70 capitalize">
                          {source.replace(/_/g, " ")}
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <>
                    <div className="text-center p-3 bg-oma-cream/10 rounded-lg border border-oma-beige">
                      <div className="text-lg font-semibold text-oma-cocoa">
                        456
                      </div>
                      <div className="text-xs text-oma-cocoa/70">Direct</div>
                    </div>
                    <div className="text-center p-3 bg-oma-cream/10 rounded-lg border border-oma-beige">
                      <div className="text-lg font-semibold text-oma-cocoa">
                        234
                      </div>
                      <div className="text-xs text-oma-cocoa/70">
                        Organic Search
                      </div>
                    </div>
                    <div className="text-center p-3 bg-oma-cream/10 rounded-lg border border-oma-beige">
                      <div className="text-lg font-semibold text-oma-cocoa">
                        189
                      </div>
                      <div className="text-xs text-oma-cocoa/70">
                        Social Media
                      </div>
                    </div>
                    <div className="text-center p-3 bg-oma-cream/10 rounded-lg border border-oma-beige">
                      <div className="text-lg font-semibold text-oma-cocoa">
                        123
                      </div>
                      <div className="text-xs text-oma-cocoa/70">Referral</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Recent Activity */}
      {/* <div className="mt-6">
              <h4 className="font-medium text-oma-plum mb-3">
                Recent Activity
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-oma-cream/10 rounded-lg border border-oma-beige">
                  <span className="text-sm text-oma-cocoa">
                    Last lead submission
                  </span>
                  <span className="text-sm font-medium text-oma-plum">
                    {analytics?.monthly_trends?.[
                      analytics.monthly_trends.length - 1
                    ]?.month
                      ? new Date(
                          analytics.monthly_trends[
                            analytics.monthly_trends.length - 1
                          ].month
                        ).toLocaleDateString()
                      : "2 days ago"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-oma-cream/10 rounded-lg border border-oma-beige">
                  <span className="text-sm text-oma-cocoa">
                    Total leads this month
                  </span>
                  <span className="text-sm font-medium text-oma-plum">
                    {analytics?.this_month_leads || "23"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )} */}
    </div>
  );
}
