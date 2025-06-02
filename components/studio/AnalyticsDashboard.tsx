"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getAnalyticsData,
  getBrandGrowthData,
  getReviewTrendsData,
  type AnalyticsData,
} from "@/lib/services/analyticsService";
import {
  BarChart3,
  Users,
  MessageSquare,
  Package,
  Eye,
  TrendingUp,
  Star,
  Calendar,
  CheckCircle,
  Activity,
} from "lucide-react";
import { Loading } from "@/components/ui/loading";

interface AnalyticsDashboardProps {
  userId: string;
}

export default function AnalyticsDashboard({
  userId,
}: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [brandGrowthData, setBrandGrowthData] = useState<
    { month: string; brands: number }[]
  >([]);
  const [reviewTrendsData, setReviewTrendsData] = useState<
    { month: string; reviews: number; avgRating: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log("📊 Fetching analytics dashboard data...");

        const [analytics, brandGrowth, reviewTrends] = await Promise.all([
          getAnalyticsData(),
          getBrandGrowthData(),
          getReviewTrendsData(),
        ]);

        setAnalyticsData(analytics);
        setBrandGrowthData(brandGrowth);
        setReviewTrendsData(reviewTrends);

        console.log("✅ Analytics dashboard data loaded successfully");
      } catch (error) {
        console.error("❌ Error fetching analytics data:", error);
        setError("Failed to load analytics data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-6 w-6 text-oma-plum" />
          <h2 className="text-2xl font-canela text-oma-black">
            Analytics Dashboard
          </h2>
        </div>
        <div className="flex justify-center items-center py-12">
          <Loading />
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-6 w-6 text-oma-plum" />
          <h2 className="text-2xl font-canela text-oma-black">
            Analytics Dashboard
          </h2>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-oma-cocoa/40 mb-4" />
            <h3 className="text-lg font-medium text-oma-black mb-2">
              Unable to Load Analytics
            </h3>
            <p className="text-oma-cocoa text-center">
              {error || "There was an error loading the analytics data."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const getGrowthPercentage = (current: number, recent: number): number => {
    if (current === 0) return 0;
    return Math.round((recent / current) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-6 w-6 text-oma-plum" />
        <h2 className="text-2xl font-canela text-oma-black">
          Analytics Dashboard
        </h2>
        <Badge variant="outline" className="ml-2">
          Super Admin
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Brands */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
            <Users className="h-4 w-4 text-oma-plum" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analyticsData.totalBrands)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                +{analyticsData.recentBrands} this month
              </Badge>
              {analyticsData.recentBrands > 0 && (
                <TrendingUp className="h-3 w-3 text-green-500" />
              )}
            </div>
            <p className="text-xs text-oma-cocoa mt-1">
              {analyticsData.verifiedBrands} verified •{" "}
              {analyticsData.activeBrands} active
            </p>
          </CardContent>
        </Card>

        {/* Total Reviews */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-oma-plum" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analyticsData.totalReviews)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                +{analyticsData.recentReviews} this month
              </Badge>
              {analyticsData.recentReviews > 0 && (
                <TrendingUp className="h-3 w-3 text-green-500" />
              )}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
              <p className="text-xs text-oma-cocoa">
                {analyticsData.averageRating} avg rating
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Collections */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections</CardTitle>
            <Package className="h-4 w-4 text-oma-plum" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analyticsData.totalCollections)}
            </div>
            <p className="text-xs text-oma-cocoa mt-2">
              Curated brand collections
            </p>
          </CardContent>
        </Card>

        {/* Page Views */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-oma-plum" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analyticsData.totalPageViews)}
            </div>
            <p className="text-xs text-oma-cocoa mt-2">Estimated total views</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-oma-plum" />
              Brand Growth (6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {brandGrowthData.length > 0 ? (
              <div className="space-y-4">
                {brandGrowthData.map((data, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-oma-cocoa">{data.month}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-oma-plum h-2 rounded-full"
                          style={{
                            width: `${Math.max((data.brands / Math.max(...brandGrowthData.map((d) => d.brands))) * 100, 5)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">
                        {data.brands}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-oma-cocoa text-center py-8">
                No growth data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Review Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-oma-plum" />
              Review Trends (6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reviewTrendsData.length > 0 ? (
              <div className="space-y-4">
                {reviewTrendsData.map((data, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-oma-cocoa">{data.month}</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-xs">{data.avgRating}</span>
                      </div>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-oma-plum h-2 rounded-full"
                          style={{
                            width: `${Math.max((data.reviews / Math.max(...reviewTrendsData.map((d) => d.reviews))) * 100, 5)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-6 text-right">
                        {data.reviews}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-oma-cocoa text-center py-8">
                No review data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-oma-plum" />
            Platform Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(
                  (analyticsData.verifiedBrands / analyticsData.totalBrands) *
                    100
                )}
                %
              </div>
              <p className="text-sm text-oma-cocoa">Verified Brands</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-8 w-8 text-yellow-500 fill-current" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {analyticsData.averageRating}
              </div>
              <p className="text-sm text-oma-cocoa">Average Rating</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-8 w-8 text-oma-plum" />
              </div>
              <div className="text-2xl font-bold text-oma-plum">
                {getGrowthPercentage(
                  analyticsData.totalBrands,
                  analyticsData.recentBrands
                )}
                %
              </div>
              <p className="text-sm text-oma-cocoa">Monthly Growth</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
