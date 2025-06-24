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
import { RefreshCw, Star } from "lucide-react";
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
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [platformLoading, setPlatformLoading] = useState(true);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [platformError, setPlatformError] = useState<string | null>(null);

  const { updateLead } = useLeadMutations();

  // Determine user access level
  const isSuperAdmin =
    user?.role === "super_admin" || userRole === "super_admin";
  const isBrandAdmin =
    user?.role === "brand_admin" || userRole === "brand_admin";
  const effectiveOwnedBrands =
    ownedBrandIds.length > 0 ? ownedBrandIds : user?.owned_brands || [];

  const fetchLeads = async () => {
    try {
      setLeadsLoading(true);
      setLeadsError(null);

      const response = await fetch("/api/admin/leads?action=list");
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

      const response = await fetch("/api/admin/leads?action=analytics");
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

      const platformData = await getAnalyticsData();
      setPlatformAnalytics(platformData);
    } catch (error) {
      console.error("Platform analytics fetch error:", error);
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
    const now = Date.now();
    if (now - lastLogTime.current > 5000) {
      // Log every 5 seconds max
      console.log("🔍 LeadsTrackingDashboard Debug:", {
        user: user?.email,
        authLoading,
        leadsLoading,
        analyticsLoading,
        leadsCount: leads?.length,
        totalCount,
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
  }, [
    user,
    authLoading,
    leadsLoading,
    analyticsLoading,
    leads?.length,
    totalCount,
    analytics?.total_leads,
    analytics?.qualified_leads,
    analytics?.conversion_rate,
    analytics?.total_bookings,
  ]);

  useEffect(() => {
    if (user) {
      fetchLeads();
      fetchAnalytics();
      fetchPlatformAnalytics();
    }
  }, [user, currentPage, filters]);

  const handleStatusChange = async (
    leadId: string,
    newStatus: Lead["status"]
  ) => {
    try {
      await updateLead(leadId, { status: newStatus });
      toast.success("Lead status updated successfully");
      fetchLeads();
      refetchAnalytics();
    } catch (error) {
      toast.error("Failed to update lead status");
    }
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
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

      {/* Platform Overview Section */}
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
              <h3 className="text-sm font-medium text-oma-cocoa">Page Views</h3>
              <p className="text-2xl font-canela text-oma-plum">
                {platformAnalytics?.totalPageViews
                  ? platformAnalytics.totalPageViews.toLocaleString()
                  : "0"}
              </p>
              <p className="text-sm text-oma-cocoa">Estimated monthly</p>
            </Card>
            <Card className="p-4 border-l-4 border-l-purple-500">
              <h3 className="text-sm font-medium text-oma-cocoa">Avg Rating</h3>
              <p className="text-2xl font-canela text-oma-plum flex items-center">
                {platformAnalytics?.averageRating?.toFixed(1) || "0.0"}
                <Star className="h-5 w-5 text-yellow-400 ml-1 fill-current" />
              </p>
              <p className="text-sm text-oma-cocoa">Platform average</p>
            </Card>
          </div>
        )}
      </div>

      {/* Leads Analytics Section */}
      <div>
        <h2 className="text-2xl font-canela text-oma-plum mb-6">
          Leads & Bookings Analytics
        </h2>

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
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Leads by Source Chart */}
        <Card className="p-6 border-oma-beige">
          <h3 className="text-lg font-canela text-oma-plum mb-4">
            Leads by Source
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(analytics?.leads_by_source || {}).map(
                    ([name, value]) => ({
                      name,
                      value,
                    })
                  )}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#6B46C1"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {Object.entries(analytics?.leads_by_source || {}).map(
                    (entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    )
                  )}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FEF7ED",
                    border: "1px solid #F3E8D7",
                    borderRadius: "8px",
                    color: "#7C2D12",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Revenue Metrics */}
        <Card className="p-6 border-oma-beige">
          <h3 className="text-lg font-canela text-oma-plum mb-4">
            Revenue Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-oma-cream/30 rounded border border-oma-beige">
              <span className="text-sm font-medium text-oma-cocoa">
                Total Booking Value
              </span>
              <span className="text-lg font-canela text-oma-plum">
                {formatCurrency(analytics?.total_booking_value || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-oma-cream/30 rounded border border-oma-beige">
              <span className="text-sm font-medium text-oma-cocoa">
                Average Booking Value
              </span>
              <span className="text-lg font-canela text-oma-plum">
                {formatCurrency(analytics?.average_booking_value || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-oma-cream/30 rounded border border-oma-beige">
              <span className="text-sm font-medium text-oma-cocoa">
                Total Commission Earned
              </span>
              <span className="text-lg font-canela text-green-600">
                {formatCurrency(analytics?.total_commission_earned || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-oma-cream/30 rounded border border-oma-beige">
              <span className="text-sm font-medium text-oma-cocoa">
                This Month Revenue
              </span>
              <span className="text-lg font-canela text-blue-600">
                {formatCurrency(analytics?.this_month_revenue || 0)}
              </span>
            </div>
          </div>
        </Card>
      </div>

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
                    className="border-b border-oma-beige hover:bg-oma-cream/10"
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
    </div>
  );
}
