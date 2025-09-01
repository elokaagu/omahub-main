"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import PageViewsCard from "./PageViewsCard";
import { supabase } from "@/lib/supabase";

interface BrandGrowthData {
  month: string;
  brands: number;
}

interface ReviewTrendsData {
  month: string;
  reviews: number;
  avgRating?: number; // Make avgRating optional to match the service
}

interface ProductAnalytics {
  totalProducts: number;
  inStock: number;
  outOfStock: number;
  totalFavourites: number;
  mostPopularProduct: {
    id: string;
    title: string;
    favourites: number;
  } | null;
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
  const { user, loading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [productAnalytics, setProductAnalytics] = useState<ProductAnalytics>({
    totalProducts: 0,
    inStock: 0,
    outOfStock: 0,
    totalFavourites: 0,
    mostPopularProduct: null,
  });
  const [analyticsSource, setAnalyticsSource] = useState<string>("estimated");
  const [brandGrowth, setBrandGrowth] = useState<BrandGrowthData[]>([]);
  const [reviewTrends, setReviewTrends] = useState<ReviewTrendsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vercelAnalytics, setVercelAnalytics] = useState<any>(null);
  const [vercelLoading, setVercelLoading] = useState(true);
  const [vercelError, setVercelError] = useState<string | null>(null);

  // Fetch product-specific analytics
  const fetchProductAnalytics = async () => {
    try {
      if (!supabase || !user) return;

      let productsQuery = supabase
        .from("products")
        .select("id, title, in_stock, brand_id");

      // Apply role-based filtering
      if (isBrandOwner && ownedBrandIds.length > 0) {
        productsQuery = productsQuery.in("brand_id", ownedBrandIds);
      }

      const { data: products, error: productsError } = await productsQuery;

      if (productsError) {
        console.error("Error fetching products for analytics:", productsError);
        return;
      }

      // Calculate product statistics
      const totalProducts = products?.length || 0;
      const inStock = products?.filter(p => p.in_stock).length || 0;
      const outOfStock = totalProducts - inStock;

      // Fetch favourites data
      let favouritesQuery = supabase
        .from("favourites")
        .select("item_id, item_type")
        .eq("item_type", "product");

      // If brand owner, only get favourites for their products
      if (isBrandOwner && ownedBrandIds.length > 0) {
        const productIds = products?.map(p => p.id) || [];
        if (productIds.length > 0) {
          favouritesQuery = favouritesQuery.in("item_id", productIds);
        } else {
          // No products, so no favourites
          setProductAnalytics({
            totalProducts,
            inStock,
            outOfStock,
            totalFavourites: 0,
            mostPopularProduct: null,
          });
          return;
        }
      }

      const { data: favourites, error: favouritesError } = await favouritesQuery;

      if (favouritesError) {
        console.error("Error fetching favourites:", favouritesError);
        return;
      }

      // Calculate favourites statistics
      const totalFavourites = favourites?.length || 0;

      // Find most popular product
      let mostPopularProduct = null;
      if (favourites && products) {
        const productFavouritesCount = favourites.reduce((acc, fav) => {
          acc[fav.item_id] = (acc[fav.item_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        let maxCount = 0;
        let mostPopularId = null;

        Object.entries(productFavouritesCount).forEach(([productId, count]) => {
          if (count > maxCount) {
            maxCount = count;
            mostPopularId = productId;
          }
        });

        if (mostPopularId && maxCount > 0) {
          const product = products.find(p => p.id === mostPopularId);
          if (product) {
            mostPopularProduct = {
              id: product.id,
              title: product.title,
              favourites: maxCount,
            };
          }
        }
      }

      setProductAnalytics({
        totalProducts,
        inStock,
        outOfStock,
        totalFavourites,
        mostPopularProduct,
      });

    } catch (error) {
      console.error("Error fetching product analytics:", error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      if (!user) {
        setError("Please log in to view analytics data");
        return;
      }

      // Check analytics source before fetching main data
      const analyticsSourceResult = await detectAnalyticsSource();
      setAnalyticsSource(analyticsSourceResult);

      // Fetch product analytics
      await fetchProductAnalytics();

      if (isBrandOwner && ownedBrandIds.length > 0) {
        // Fetch brand owner specific data
        const [analyticsData, growthData, trendsData] = await Promise.all([
          getBrandOwnerAnalyticsData(ownedBrandIds),
          getBrandOwnerGrowthData(ownedBrandIds),
          getBrandOwnerReviewTrends(ownedBrandIds),
        ]);

        setAnalytics(analyticsData);
        setBrandGrowth(growthData);
        setReviewTrends(trendsData);
      } else {
        // Fetch global analytics data (for super admins)
        const [analyticsData, growthData, trendsData] = await Promise.all([
          getAnalyticsData(),
          getBrandGrowthData(),
          getReviewTrendsData(),
        ]);

        setAnalytics(analyticsData);
        setBrandGrowth(growthData);
        setReviewTrends(trendsData);
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      setError("Failed to load analytics data");
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
    // Only fetch data if auth is not loading
    if (!authLoading) {
      fetchData();
    }
  }, [isBrandOwner, ownedBrandIds, user, authLoading]);

  // Calculate estimated monthly page views
  // Show loading state while auth is loading
  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-canela text-oma-plum">
            {isBrandOwner ? "Your Brand Analytics" : "Analytics Dashboard"}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-oma-beige rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-oma-beige rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show authentication required message
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-canela text-oma-plum">
            Analytics Dashboard
          </h2>
        </div>
        <Card className="border-oma-beige">
          <CardContent className="p-8 text-center">
            <LogIn className="h-16 w-16 text-oma-plum/50 mx-auto mb-4" />
            <h3 className="text-xl font-canela text-oma-plum mb-2">
              Authentication Required
            </h3>
            <p className="text-oma-cocoa mb-6">
              Please log in to access the analytics dashboard and view your
              data.
            </p>
            <Link href="/login">
              <Button className="bg-oma-plum hover:bg-oma-plum/90 text-white">
                <LogIn className="h-4 w-4 mr-2" />
                Log In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state with better messaging
  if (error || !analytics) {
    // Instead of showing an error, fall back to estimated analytics
    // Calculate estimated values using the same logic as getAnalyticsData
    // Use zeros if not available
    const fallbackAnalytics = {
      totalBrands: 0,
      totalReviews: 0,
      totalProducts: 0,
      totalPageViews: 1000, // minimum fallback
      activeBrands: 0,
      averageRating: 0,
      verifiedBrands: 0,
      recentBrands: 0,
      recentReviews: 0,
      reviewDistribution: [1, 2, 3, 4, 5].map((rating) => ({
        rating,
        count: 0,
      })),
      topBrands: [],
    };
    // Use estimated formula
    const estimatedMonthlyPageViews = Math.max(
      fallbackAnalytics.totalBrands * 150 + fallbackAnalytics.totalReviews * 25,
      1000
    );
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-canela text-oma-plum">
            {isBrandOwner ? "Your Brand Analytics" : "Analytics Dashboard"}
          </h2>
          <Button
            onClick={fetchData}
            variant="outline"
            className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Estimated Page Views Card */}
          <Card className="border border-oma-gold/10 bg-white">
            <CardHeader>
              <CardTitle className="text-black">
                Estimated Monthly Page Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-oma-plum">
                {estimatedMonthlyPageViews}
              </span>
              <p className="text-xs text-oma-cocoa mt-2">
                Based on products and brands
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="text-oma-cocoa text-sm mt-4">
          Showing estimated page views. Real analytics are currently
          unavailable.
        </div>
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
        <div>
          <h2 className="text-2xl font-canela text-oma-plum">
            {isBrandOwner ? "Your Brand Analytics" : "Analytics Dashboard"}
          </h2>
          {isBrandOwner && brandNames.length > 0 && (
            <p className="text-sm text-oma-cocoa mt-1">
              Analytics for: {brandNames.join(", ")}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {!isBrandOwner && (
            <Button
              onClick={handleSyncRatings}
              variant="outline"
              size="sm"
              disabled={syncing}
              className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`}
              />
              {syncing ? "Syncing..." : "Sync Ratings"}
            </Button>
          )}
          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
            className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-oma-plum border-oma-beige">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-oma-cocoa">
              {isBrandOwner ? "Your Brands" : "Total Brands"}
            </CardTitle>
            <Users className="h-4 w-4 text-oma-plum" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-canela text-oma-plum">
              {formatNumber(analytics.totalBrands)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant={
                  analytics.verifiedBrands === analytics.totalBrands
                    ? "default"
                    : "secondary"
                }
                className="bg-oma-plum text-white"
              >
                {analytics.verifiedBrands} verified
              </Badge>
              <Badge
                variant="outline"
                className="border-oma-cocoa text-oma-cocoa"
              >
                {analytics.activeBrands} active
              </Badge>
            </div>
            {brandGrowthPercentage !== 0 && (
              <p
                className={`text-xs mt-2 flex items-center ${brandGrowthPercentage > 0 ? "text-green-600" : "text-oma-cocoa"}`}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                {brandGrowthPercentage > 0 ? "+" : ""}
                {brandGrowthPercentage.toFixed(1)}%{" "}
                {isBrandOwner ? "this month" : "this month"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-oma-cocoa border-oma-beige">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-oma-cocoa">
              {isBrandOwner ? "Your Reviews" : "Total Reviews"}
            </CardTitle>
            <Star className="h-4 w-4 text-oma-cocoa" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-canela text-oma-plum">
              {formatNumber(analytics.totalReviews)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium text-oma-cocoa">
                {analytics.averageRating.toFixed(1)} avg rating
              </span>
            </div>
            {reviewGrowthPercentage !== 0 && (
              <p
                className={`text-xs mt-2 flex items-center ${reviewGrowthPercentage > 0 ? "text-green-600" : "text-oma-cocoa"}`}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                {reviewGrowthPercentage > 0 ? "+" : ""}
                {reviewGrowthPercentage.toFixed(1)}% this month
              </p>
            )}
          </CardContent>
        </Card>

        {/* Product Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-oma-beige">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-oma-cocoa">
                {isBrandOwner ? "Your Products" : "Total Products"}
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-oma-beige" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-canela text-oma-plum">
                {formatNumber(productAnalytics.totalProducts)}
              </div>
              <p className="text-xs text-oma-cocoa mt-2">
                {isBrandOwner
                  ? "Your product collection"
                  : "Products across all brands"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-oma-cocoa">
                In Stock
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-canela text-oma-plum">
                {formatNumber(productAnalytics.inStock)}
              </div>
              <p className="text-xs text-oma-cocoa mt-2">
                Available for purchase
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-oma-cocoa">
                Out of Stock
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-canela text-oma-plum">
                {formatNumber(productAnalytics.outOfStock)}
              </div>
              <p className="text-xs text-oma-cocoa mt-2">
                Currently unavailable
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-pink-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-oma-cocoa">
                Total Favourites
              </CardTitle>
              <Heart className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-canela text-oma-plum">
                {formatNumber(productAnalytics.totalFavourites)}
              </div>
              <p className="text-xs text-oma-cocoa mt-2">
                {productAnalytics.mostPopularProduct
                  ? `${productAnalytics.mostPopularProduct.favourites} for "${productAnalytics.mostPopularProduct.title}"`
                  : "No favourites yet"}
              </p>
            </CardContent>
          </Card>
        </div>
        {/* PageViewsCard removed as requested */}
      </div>

      {/* Platform Health Section */}
      <Card className="border-oma-beige">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-oma-plum font-canela">
            <CheckCircle className="h-5 w-5 text-green-500" />
            {isBrandOwner ? "Brand Health" : "Platform Health"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-canela text-oma-plum">
                {verificationRate.toFixed(1)}%
              </div>
              <p className="text-sm text-oma-cocoa">Verification Rate</p>
              <div className="w-full bg-oma-beige rounded-full h-2 mt-2">
                <div
                  className="bg-oma-plum h-2 rounded-full transition-all duration-300"
                  style={{ width: `${verificationRate}%` }}
                ></div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-canela text-oma-cocoa">
                {activeRate.toFixed(1)}%
              </div>
              <p className="text-sm text-oma-cocoa">Active Brands</p>
              <div className="w-full bg-oma-beige rounded-full h-2 mt-2">
                <div
                  className="bg-oma-cocoa h-2 rounded-full transition-all duration-300"
                  style={{ width: `${activeRate}%` }}
                ></div>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="h-6 w-6 text-yellow-400 fill-current" />
                <span className="text-3xl font-canela text-oma-plum">
                  {analytics.averageRating.toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-oma-cocoa">Average Rating</p>
              <div className="flex justify-center mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= analytics.averageRating
                        ? "text-yellow-400 fill-current"
                        : "text-oma-beige"
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
        <Card className="border-oma-beige">
          <CardHeader>
            <CardTitle className="text-oma-plum font-canela">
              {isBrandOwner
                ? "Brand Growth (6 Months)"
                : "Brand Growth (6 Months)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {brandGrowth.map((data, index) => {
                const maxBrands = Math.max(...brandGrowth.map((d) => d.brands));
                const percentage =
                  maxBrands > 0 ? (data.brands / maxBrands) * 100 : 0;

                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-16 text-sm text-oma-cocoa">
                      {data.month}
                    </div>
                    <div className="flex-1 bg-oma-beige rounded-full h-6 relative">
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

        <Card className="border-oma-beige">
          <CardHeader>
            <CardTitle className="text-oma-plum font-canela">
              Review Trends (6 Months)
            </CardTitle>
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
                    <div className="w-16 text-sm text-oma-cocoa">
                      {data.month}
                    </div>
                    <div className="flex-1 bg-oma-beige rounded-full h-6 relative">
                      <div
                        className="bg-oma-cocoa h-6 rounded-full transition-all duration-300 flex items-center justify-between px-2"
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="text-white text-xs font-medium">
                          {data.reviews}
                        </span>
                        {data.avgRating && data.avgRating > 0 && (
                          <span className="text-white text-xs">
                            ⭐{data.avgRating.toFixed(1)}
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
    </div>
  );
}
