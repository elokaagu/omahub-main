"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getAnalyticsData,
  getBrandGrowthData,
  getReviewTrendsData,
  syncBrandRatings,
  type AnalyticsData,
} from "@/lib/services/analyticsService";
import {
  Users,
  Eye,
  TrendingUp,
  Star,
  CheckCircle,
  ShoppingBag,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface BrandGrowthData {
  month: string;
  brands: number;
}

interface ReviewTrendsData {
  month: string;
  reviews: number;
  avgRating: number;
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [brandGrowth, setBrandGrowth] = useState<BrandGrowthData[]>([]);
  const [reviewTrends, setReviewTrends] = useState<ReviewTrendsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [analyticsData, growthData, trendsData] = await Promise.all([
        getAnalyticsData(),
        getBrandGrowthData(),
        getReviewTrendsData(),
      ]);

      setAnalytics(analyticsData);
      setBrandGrowth(growthData);
      setReviewTrends(trendsData);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("Failed to load analytics data");
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncRatings = async () => {
    try {
      setSyncing(true);
      const result = await syncBrandRatings();

      if (result.updated > 0) {
        toast.success(`Successfully updated ${result.updated} brand ratings`);
        // Refresh analytics data
        await fetchData();
      } else {
        toast.info("All brand ratings were already accurate");
      }

      if (result.errors > 0) {
        toast.warning(`${result.errors} brands had sync errors`);
      }
    } catch (err) {
      console.error("Error syncing ratings:", err);
      toast.error("Failed to sync brand ratings");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-oma-plum">
            Analytics Dashboard
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-oma-plum">
            Analytics Dashboard
          </h2>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">
              {error || "Failed to load analytics data"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate growth percentages
  const brandGrowthPercentage =
    brandGrowth.length >= 2
      ? (((brandGrowth[brandGrowth.length - 1]?.brands || 0) -
          (brandGrowth[brandGrowth.length - 2]?.brands || 0)) /
          Math.max(brandGrowth[brandGrowth.length - 2]?.brands || 1, 1)) *
        100
      : 0;

  const reviewGrowthPercentage =
    reviewTrends.length >= 2
      ? (((reviewTrends[reviewTrends.length - 1]?.reviews || 0) -
          (reviewTrends[reviewTrends.length - 2]?.reviews || 0)) /
          Math.max(reviewTrends[reviewTrends.length - 2]?.reviews || 1, 1)) *
        100
      : 0;

  const verificationRate =
    analytics.totalBrands > 0
      ? (analytics.verifiedBrands / analytics.totalBrands) * 100
      : 0;

  const activeRate =
    analytics.totalBrands > 0
      ? (analytics.activeBrands / analytics.totalBrands) * 100
      : 0;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-oma-plum">
          Analytics Dashboard
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={handleSyncRatings}
            variant="outline"
            size="sm"
            disabled={syncing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Syncing..." : "Sync Ratings"}
          </Button>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-oma-plum">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
            <Users className="h-4 w-4 text-oma-plum" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analytics.totalBrands)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant={
                  analytics.verifiedBrands === analytics.totalBrands
                    ? "default"
                    : "secondary"
                }
              >
                {analytics.verifiedBrands} verified
              </Badge>
              <Badge variant="outline">{analytics.activeBrands} active</Badge>
            </div>
            {brandGrowthPercentage !== 0 && (
              <p
                className={`text-xs mt-2 flex items-center ${brandGrowthPercentage > 0 ? "text-green-600" : "text-red-600"}`}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                {brandGrowthPercentage > 0 ? "+" : ""}
                {brandGrowthPercentage.toFixed(1)}% this month
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-oma-cocoa">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <Star className="h-4 w-4 text-oma-cocoa" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analytics.totalReviews)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium">
                {analytics.averageRating.toFixed(1)} avg rating
              </span>
            </div>
            {reviewGrowthPercentage !== 0 && (
              <p
                className={`text-xs mt-2 flex items-center ${reviewGrowthPercentage > 0 ? "text-green-600" : "text-red-600"}`}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                {reviewGrowthPercentage > 0 ? "+" : ""}
                {reviewGrowthPercentage.toFixed(1)}% this month
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections</CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analytics.totalCollections)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Brand showcases and galleries
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estimated Page Views
            </CardTitle>
            <Eye className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analytics.totalPageViews)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on engagement metrics
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Health Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Platform Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-oma-plum">
                {verificationRate.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Verification Rate</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-oma-plum h-2 rounded-full transition-all duration-300"
                  style={{ width: `${verificationRate}%` }}
                ></div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-oma-cocoa">
                {activeRate.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Active Brands</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-oma-cocoa h-2 rounded-full transition-all duration-300"
                  style={{ width: `${activeRate}%` }}
                ></div>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="h-6 w-6 text-yellow-400 fill-current" />
                <span className="text-3xl font-bold">
                  {analytics.averageRating.toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
              <div className="flex justify-center mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= analytics.averageRating
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Brand Growth (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {brandGrowth.map((data, index) => {
                const maxBrands = Math.max(...brandGrowth.map((d) => d.brands));
                const percentage =
                  maxBrands > 0 ? (data.brands / maxBrands) * 100 : 0;

                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-16 text-sm text-muted-foreground">
                      {data.month}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                      <div
                        className="bg-oma-plum h-6 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="text-white text-xs font-medium">
                          {data.brands}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review Trends (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reviewTrends.map((data, index) => {
                const maxReviews = Math.max(
                  ...reviewTrends.map((d) => d.reviews)
                );
                const percentage =
                  maxReviews > 0 ? (data.reviews / maxReviews) * 100 : 0;

                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-16 text-sm text-muted-foreground">
                      {data.month}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                      <div
                        className="bg-oma-cocoa h-6 rounded-full transition-all duration-300 flex items-center justify-between px-2"
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="text-white text-xs font-medium">
                          {data.reviews}
                        </span>
                        {data.avgRating > 0 && (
                          <span className="text-white text-xs">
                            ⭐{data.avgRating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-oma-plum/10 rounded-lg">
                <Users className="h-6 w-6 text-oma-plum" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {analytics.recentBrands}
                </div>
                <p className="text-sm text-muted-foreground">
                  New brands added
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-oma-cocoa/10 rounded-lg">
                <Star className="h-6 w-6 text-oma-cocoa" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {analytics.recentReviews}
                </div>
                <p className="text-sm text-muted-foreground">
                  New reviews posted
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
