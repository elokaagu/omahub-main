"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Eye,
  TrendingUp,
  Star,
  CheckCircle,
  ShoppingBag,
  RefreshCw,
  AlertTriangle,
  LogIn,
  BarChart3,
  Activity,
  Globe,
  MousePointer,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { 
  fetchRealGoogleAnalyticsData, 
  isGoogleAnalyticsConfigured,
  getConfigurationStatus 
} from "@/lib/services/googleAnalyticsService";

interface GoogleAnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  topPages: Array<{ page: string; views: number }>;
  topSources: Array<{ source: string; sessions: number }>;
  deviceBreakdown: Array<{ device: string; percentage: number }>;
  recentActivity: Array<{ action: string; timestamp: string; value?: string }>;
}

interface AnalyticsDashboardProps {
  isBrandOwner?: boolean;
  ownedBrandIds?: string[];
  brandNames?: string[];
}

export default function AnalyticsDashboard({
  isBrandOwner = false,
  ownedBrandIds = [],
  brandNames = [],
}: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<GoogleAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");



  // Mock Google Analytics data for demonstration (fallback)
  const mockGoogleAnalyticsData: GoogleAnalyticsData = {
    pageViews: 0,
    uniqueVisitors: 0,
    bounceRate: 0,
    avgSessionDuration: 0,
    topPages: [],
    topSources: [],
    deviceBreakdown: [],
    recentActivity: [],
  };

  const fetchGoogleAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if Google Analytics is properly configured
      const isConfigured = isGoogleAnalyticsConfigured();
      
      if (isConfigured) {
        // Try to fetch real data from Google Analytics API
        const realData = await fetchRealGoogleAnalyticsData();
        setAnalyticsData(realData);
        setLastUpdated(new Date().toLocaleTimeString());
        toast.success("Real Google Analytics data fetched successfully!");
      } else {
        // Use mock data when API is not configured
        setAnalyticsData(mockGoogleAnalyticsData);
        setLastUpdated(new Date().toLocaleTimeString());
        toast.info("Using demo data - Google Analytics API not configured");
      }
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError("Failed to fetch Google Analytics data");
      toast.error("Failed to fetch analytics data");
      // Fallback to mock data on error
      setAnalyticsData(mockGoogleAnalyticsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoogleAnalyticsData();
  }, []);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Analytics Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchGoogleAnalyticsData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-6 text-center">
          <BarChart3 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Analytics Data</h3>
          <p className="text-gray-600">Google Analytics data is not available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Google Analytics Dashboard</h2>
          <p className="text-gray-600">
            Real-time insights from Google Analytics 4
            {lastUpdated && (
              <span className="ml-2 text-sm text-gray-500">
                Last updated: {lastUpdated}
              </span>
            )}
          </p>
        </div>
        <Button onClick={fetchGoogleAnalyticsData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Page Views</p>
                <p className="text-2xl font-bold text-blue-900">{analyticsData.pageViews.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Unique Visitors</p>
                <p className="text-2xl font-bold text-green-900">{analyticsData.uniqueVisitors.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Bounce Rate</p>
                <p className="text-2xl font-bold text-purple-900">{analyticsData.bounceRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Avg Session</p>
                <p className="text-2xl font-bold text-orange-900">{formatDuration(analyticsData.avgSessionDuration)}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages and Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Top Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="w-8 text-center">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{page.page}</span>
                  </div>
                  <span className="text-gray-600">{page.views.toLocaleString()} views</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointer className="h-5 w-5" />
              Traffic Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.topSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="w-8 text-center">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{source.source}</span>
                  </div>
                  <span className="text-gray-600">{source.sessions.toLocaleString()} sessions</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Breakdown and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Device Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.deviceBreakdown.map((device, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{device.device}</span>
                    <span className="text-gray-600">{device.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${device.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-sm">{activity.action}</p>
                    {activity.value && (
                      <p className="text-xs text-gray-600">{activity.value}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{activity.timestamp}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Google Analytics Integration Status */}
      <Card className={`${isGoogleAnalyticsConfigured() ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            {isGoogleAnalyticsConfigured() ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            )}
            <div>
              <h3 className={`font-semibold ${isGoogleAnalyticsConfigured() ? 'text-green-800' : 'text-yellow-800'}`}>
                {isGoogleAnalyticsConfigured() ? 'Google Analytics Active' : 'Google Analytics Setup Required'}
              </h3>
              <p className={`text-sm ${isGoogleAnalyticsConfigured() ? 'text-green-600' : 'text-yellow-600'}`}>
                {isGoogleAnalyticsConfigured() 
                  ? 'Tracking page views, user behavior, and conversion events across the platform'
                  : 'Service account setup required to fetch real data from Google Analytics 4'
                }
              </p>
              {!isGoogleAnalyticsConfigured() && (
                <div className="mt-2 text-xs text-yellow-700">
                  <p>Current GA ID: {getConfigurationStatus().gaMeasurementId}</p>
                  <p>Status: Demo mode - showing sample data</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
