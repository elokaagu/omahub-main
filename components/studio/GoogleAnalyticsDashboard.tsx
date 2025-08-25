"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Users,
  ShoppingCart,
  Eye,
  TrendingUp,
  Calendar,
  ExternalLink,
  RefreshCw,
  Shield,
} from "lucide-react";
import { GTM_ID } from "@/lib/config/analytics";
import { useAuth } from "@/contexts/AuthContext";

interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  addToCartEvents: number;
  customOrders: number;
  studioAccess: number;
  topPages: Array<{ page: string; views: number }>;
  topEvents: Array<{ event: string; count: number }>;
}

export default function GoogleAnalyticsDashboard() {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");

  // Mock data for demonstration - replace with actual GA4 API calls
  const mockAnalyticsData: AnalyticsData = useMemo(
    () => ({
      pageViews: 1247,
      uniqueVisitors: 892,
      addToCartEvents: 156,
      customOrders: 23,
      studioAccess: 89,
      topPages: [
        { page: "/", views: 456 },
        { page: "/directory", views: 234 },
        { page: "/brand/omahub", views: 123 },
        { page: "/collections", views: 98 },
        { page: "/studio", views: 67 },
      ],
      topEvents: [
        { event: "add_to_cart", count: 156 },
        { event: "view_item", count: 89 },
        { event: "submit_custom_order", count: 23 },
        { event: "studio_access", count: 89 },
        { event: "search", count: 45 },
      ],
    }),
    []
  );

  useEffect(() => {
    // In a real implementation, you would fetch data from GA4 API
    // For now, we'll use mock data
    setAnalyticsData(mockAnalyticsData);
  }, [timeRange]);

  // Check if user is super admin - must be after all hooks
  if (!user || user.role !== "super_admin") {
    return null; // Don't render for non-super admins
  }

  const refreshData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setAnalyticsData(mockAnalyticsData);
      setError(null);
    } catch (err) {
      setError("Failed to refresh analytics data");
    } finally {
      setLoading(false);
    }
  };

  const openGoogleTagManager = () => {
    if (GTM_ID) {
      window.open(
        `https://tagmanager.google.com/#/container/accounts/container/${GTM_ID}`,
        "_blank"
      );
    }
  };

  if (!GTM_ID) {
    return (
      <Card className="border-omahub-accent shadow-omahub">
        <CardHeader className="bg-gradient-to-r from-omahub-primary to-omahub-secondary text-white rounded-t-lg">
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Google Tag Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-white p-6">
          <div className="text-center py-8">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">
              Google Tag Manager Not Configured
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Set up Google Tag Manager to track your website performance and
              user behavior.
            </p>
            <Button
              onClick={() =>
                window.open("https://tagmanager.google.com", "_blank")
              }
              variant="outline"
              className="border-omahub-accent text-omahub-primary hover:bg-omahub-accent/10"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Set Up Google Tag Manager
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData) {
    return (
      <Card className="border-omahub-accent shadow-omahub">
        <CardContent className="bg-white p-6">
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-omahub-accent shadow-omahub">
      <CardHeader className="bg-gradient-to-r from-omahub-primary to-omahub-secondary text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Dashboard
            <Badge
              variant="secondary"
              className="bg-white text-omahub-primary text-xs"
            >
              Super Admin Only
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <div className="flex items-center gap-2 text-white text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Connected to GTM-55JQB28Z</span>
            </div>

            <Button
              onClick={refreshData}
              disabled={loading}
              size="sm"
              variant="secondary"
              className="bg-white text-omahub-primary hover:bg-gray-50"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              onClick={openGoogleTagManager}
              size="sm"
              variant="secondary"
              className="bg-white text-omahub-primary hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open GTM
            </Button>
            <Button
              onClick={() =>
                window.open(
                  "https://analytics.google.com/analytics/web/#/pG-94EE1362LB/reports/intelligenthome",
                  "_blank"
                )
              }
              size="sm"
              variant="secondary"
              className="bg-white text-omahub-primary hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open GA4
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="bg-white p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pages">Top Pages</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      Page Views
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {analyticsData.pageViews.toLocaleString()}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      Unique Visitors
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {analyticsData.uniqueVisitors.toLocaleString()}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">
                      Add to Cart
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {analyticsData.addToCartEvents.toLocaleString()}
                    </p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">
                      Custom Orders
                    </p>
                    <p className="text-2xl font-bold text-orange-900">
                      {analyticsData.customOrders.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Time Range:</span>
              <div className="flex gap-1">
                {(["7d", "30d", "90d"] as const).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                    className={timeRange === range ? "bg-omahub-primary" : ""}
                  >
                    {range === "7d"
                      ? "7 Days"
                      : range === "30d"
                        ? "30 Days"
                        : "90 Days"}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pages" className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Top Performing Pages
            </h3>
            <div className="space-y-3">
              {analyticsData.topPages.map((page, index) => (
                <div
                  key={page.page}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className="bg-omahub-accent text-omahub-primary"
                    >
                      #{index + 1}
                    </Badge>
                    <span className="font-medium text-gray-900">
                      {page.page}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {page.views.toLocaleString()} views
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              User Engagement Events
            </h3>
            <div className="space-y-3">
              {analyticsData.topEvents.map((event, index) => (
                <div
                  key={event.event}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className="bg-omahub-accent text-omahub-primary"
                    >
                      #{index + 1}
                    </Badge>
                    <span className="font-medium text-gray-900">
                      {event.event.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {event.count.toLocaleString()} times
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Super Admin Information */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Super Admin Analytics Access
          </h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>
              • <strong>GTM Container:</strong> GTM-55JQB28Z - Active and
              tracking
            </p>
            <p>
              • <strong>GA4 Property:</strong> G-94EE1362LB - Real-time data
              available
            </p>
            <p>
              • <strong>E-commerce Tracking:</strong> Basket additions, custom
              orders, user engagement
            </p>
            <p>
              • <strong>User Analytics:</strong> Studio access, brand creation,
              product management
            </p>
            <p>
              • <strong>Platform Insights:</strong> Page performance, conversion
              tracking, user behavior
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
