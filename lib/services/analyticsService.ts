import { supabase } from "@/lib/supabase";

export interface AnalyticsData {
  totalBrands: number;
  totalReviews: number;
  totalCollections: number;
  totalPageViews: number;
  activeBrands: number;
  verifiedBrands: number;
  averageRating: number;
  recentReviews: number; // reviews in last 30 days
  recentBrands: number; // brands added in last 30 days
}

/**
 * Get comprehensive analytics data for super admin dashboard
 */
export async function getAnalyticsData(): Promise<AnalyticsData> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    console.log("📊 Fetching analytics data...");

    // Get current date for recent calculations
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    // Fetch all data in parallel for better performance
    const [
      brandsResult,
      reviewsResult,
      collectionsResult,
      recentBrandsResult,
      recentReviewsResult,
    ] = await Promise.all([
      // Total brands with additional metrics
      supabase
        .from("brands")
        .select("id, is_verified, rating, created_at")
        .then(({ data, error, count }) => ({ data, error, count })),

      // Total reviews with rating data
      supabase
        .from("reviews")
        .select("id, rating, created_at")
        .then(({ data, error, count }) => ({ data, error, count })),

      // Total collections
      supabase
        .from("collections")
        .select("id", { count: "exact", head: true })
        .then(({ data, error, count }) => ({ data, error, count })),

      // Recent brands (last 30 days)
      supabase
        .from("brands")
        .select("id", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgoISO)
        .then(({ data, error, count }) => ({ data, error, count })),

      // Recent reviews (last 30 days)
      supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgoISO)
        .then(({ data, error, count }) => ({ data, error, count })),
    ]);

    // Handle errors
    if (brandsResult.error) throw brandsResult.error;
    if (reviewsResult.error) throw reviewsResult.error;
    if (collectionsResult.error) throw collectionsResult.error;
    if (recentBrandsResult.error) throw recentBrandsResult.error;
    if (recentReviewsResult.error) throw recentReviewsResult.error;

    // Process brands data
    const brands = brandsResult.data || [];
    const totalBrands = brands.length;
    const verifiedBrands = brands.filter((brand) => brand.is_verified).length;
    const activeBrands = brands.filter((brand) => brand.rating > 0).length;

    // Process reviews data
    const reviews = reviewsResult.data || [];
    const totalReviews = reviews.length;
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
          reviews.length
        : 0;

    // Get counts
    const totalCollections = collectionsResult.count || 0;
    const recentBrands = recentBrandsResult.count || 0;
    const recentReviews = recentReviewsResult.count || 0;

    // For now, we'll use a placeholder for page views since we don't have analytics tracking
    // In a real app, you'd integrate with Google Analytics or similar
    const totalPageViews = totalBrands * 50 + totalReviews * 10; // Rough estimate

    const analyticsData: AnalyticsData = {
      totalBrands,
      totalReviews,
      totalCollections,
      totalPageViews,
      activeBrands,
      verifiedBrands,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      recentReviews,
      recentBrands,
    };

    console.log("✅ Analytics data fetched successfully:", analyticsData);
    return analyticsData;
  } catch (error) {
    console.error("❌ Error fetching analytics data:", error);
    throw error;
  }
}

/**
 * Get brand growth data for charts (last 6 months)
 */
export async function getBrandGrowthData(): Promise<
  { month: string; brands: number }[]
> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data, error } = await supabase
      .from("brands")
      .select("created_at")
      .gte("created_at", sixMonthsAgo.toISOString())
      .order("created_at");

    if (error) throw error;

    // Group by month
    const monthlyData: { [key: string]: number } = {};
    const months = [];

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      const monthName = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      monthlyData[monthKey] = 0;
      months.push({ month: monthName, brands: 0, key: monthKey });
    }

    // Count brands by month
    (data || []).forEach((brand) => {
      const monthKey = brand.created_at.slice(0, 7);
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey]++;
      }
    });

    // Update counts
    months.forEach((month) => {
      month.brands = monthlyData[month.key];
    });

    return months.map(({ month, brands }) => ({ month, brands }));
  } catch (error) {
    console.error("❌ Error fetching brand growth data:", error);
    return [];
  }
}

/**
 * Get review trends data (last 6 months)
 */
export async function getReviewTrendsData(): Promise<
  { month: string; reviews: number; avgRating: number }[]
> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data, error } = await supabase
      .from("reviews")
      .select("created_at, rating")
      .gte("created_at", sixMonthsAgo.toISOString())
      .order("created_at");

    if (error) throw error;

    // Group by month
    const monthlyData: {
      [key: string]: { count: number; totalRating: number };
    } = {};
    const months = [];

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);
      const monthName = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      monthlyData[monthKey] = { count: 0, totalRating: 0 };
      months.push({
        month: monthName,
        reviews: 0,
        avgRating: 0,
        key: monthKey,
      });
    }

    // Count reviews and sum ratings by month
    (data || []).forEach((review) => {
      const monthKey = review.created_at.slice(0, 7);
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey].count++;
        monthlyData[monthKey].totalRating += review.rating || 0;
      }
    });

    // Calculate averages
    months.forEach((month) => {
      const data = monthlyData[month.key];
      month.reviews = data.count;
      month.avgRating =
        data.count > 0
          ? Math.round((data.totalRating / data.count) * 10) / 10
          : 0;
    });

    return months.map(({ month, reviews, avgRating }) => ({
      month,
      reviews,
      avgRating,
    }));
  } catch (error) {
    console.error("❌ Error fetching review trends data:", error);
    return [];
  }
}
