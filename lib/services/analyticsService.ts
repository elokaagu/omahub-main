import { supabase } from "@/lib/supabase";

export interface AnalyticsData {
  totalBrands: number;
  totalReviews: number;
  totalProducts: number;
  totalPageViews: number;
  activeBrands: number;
  verifiedBrands: number;
  averageRating: number;
  recentReviews: number; // reviews in last 30 days
  recentBrands: number; // brands added in last 30 days
}

/**
 * Fetch real page views from Google Analytics
 * This function attempts to get real analytics data from Google Analytics 4
 */
async function getGoogleAnalyticsPageViews(): Promise<number | null> {
  try {
    const response = await fetch("/api/analytics/google", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn("Failed to fetch Google Analytics, trying Vercel Analytics");
      return null;
    }

    const data = await response.json();

    if (data.pageViews && typeof data.pageViews === "number") {
      console.log("✅ Using real Google Analytics data:", {
        pageViews: data.pageViews,
        source: data.source,
        message: data.message,
      });
      return data.pageViews;
    }

    console.log("ℹ️ Google Analytics not available:", data.message);
    return null;
  } catch (error) {
    console.warn(
      "Failed to fetch Google Analytics data, trying Vercel Analytics:",
      error
    );
    return null;
  }
}

/**
 * Fetch real page views from Vercel Analytics
 * This function attempts to get real analytics data from Vercel
 */
async function getVercelPageViews(): Promise<number | null> {
  try {
    const response = await fetch("/api/analytics/pageviews", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn("Failed to fetch Vercel analytics, using estimated views");
      return null;
    }

    const data = await response.json();

    if (data.pageViews && typeof data.pageViews === "number") {
      console.log("✅ Using real Vercel Analytics data:", {
        pageViews: data.pageViews,
        source: data.source,
        message: data.message,
      });
      return data.pageViews;
    }

    console.log("ℹ️ Vercel Analytics not available:", data.message);
    return null;
  } catch (error) {
    console.warn(
      "Failed to fetch Vercel analytics data, using estimated views:",
      error
    );
    return null;
  }
}

/**
 * Fetch real page views from multiple sources with fallback
 * Tries Vercel Analytics first, skips Google Analytics for now
 */
async function getRealPageViews(): Promise<number | null> {
  // Skip Google Analytics and go straight to Vercel Analytics
  console.log("ℹ️ Skipping Google Analytics, trying Vercel Analytics...");

  // Try Vercel Analytics first
  const vercelPageViews = await getVercelPageViews();
  if (vercelPageViews !== null) {
    return vercelPageViews;
  }

  // Both failed, return null to use estimated views
  console.log(
    "ℹ️ No real analytics data available, using estimated page views"
  );
  return null;
}

/**
 * Calculate estimated page views based on engagement metrics
 */
function calculateEstimatedPageViews(
  totalBrands: number,
  totalReviews: number,
  totalProducts: number,
  verifiedBrands: number,
  recentBrands: number
): number {
  // Enhanced formula based on realistic engagement patterns
  // Base formula: (brands * 25) + (reviews * 8) + (products * 15) + (verified_brands * 50)
  // This assumes verified brands get more views, reviews indicate engagement, products are browsed
  return Math.round(
    totalBrands * 25 +
      totalReviews * 8 +
      totalProducts * 15 +
      verifiedBrands * 50 +
      recentBrands * 100 // New brands get initial traffic boost
  );
}

/**
 * Get comprehensive analytics data for the dashboard
 */
export async function getAnalyticsData(): Promise<AnalyticsData> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    console.log("🔄 Fetching analytics data...");

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    // Fetch all data in parallel for better performance
    const [
      brandsResult,
      reviewsResult,
      productsResult,
      recentBrandsResult,
      recentReviewsResult,
      realPageViews,
    ] = await Promise.all([
      // All brands with their review counts
      supabase.from("brands").select(`
          id, 
          name, 
          rating, 
          is_verified, 
          created_at,
          reviews:reviews(rating, created_at)
        `),

      // All reviews
      supabase.from("reviews").select("id, rating, created_at, brand_id"),

      // Products count
      supabase.from("products").select("id", { count: "exact", head: true }),

      // Recent brands (last 30 days)
      supabase
        .from("brands")
        .select("id", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgoISO),

      // Recent reviews (last 30 days)
      supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgoISO),

      // Try to get real page views from Vercel Analytics
      getRealPageViews(),
    ]);

    // Handle errors
    if (brandsResult.error) throw brandsResult.error;
    if (reviewsResult.error) throw reviewsResult.error;
    if (productsResult.error) throw productsResult.error;
    if (recentBrandsResult.error) throw recentBrandsResult.error;
    if (recentReviewsResult.error) throw recentReviewsResult.error;

    // Process brands data
    const brands = brandsResult.data || [];
    const totalBrands = brands.length;
    const verifiedBrands = brands.filter((brand) => brand.is_verified).length;

    // Define active brands as those with at least one review OR created in last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const activeBrands = brands.filter(
      (brand) =>
        (brand.reviews && brand.reviews.length > 0) ||
        new Date(brand.created_at) > ninetyDaysAgo
    ).length;

    // Process reviews data
    const reviews = reviewsResult.data || [];
    const totalReviews = reviews.length;

    // Calculate accurate average rating from all reviews
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
          reviews.length
        : 0;

    // Get counts
    const totalProducts = productsResult.count || 0;
    const recentBrands = recentBrandsResult.count || 0;
    const recentReviews = recentReviewsResult.count || 0;

    // Use real page views if available, otherwise calculate estimated views
    const totalPageViews =
      realPageViews !== null
        ? realPageViews
        : calculateEstimatedPageViews(
            totalBrands,
            totalReviews,
            totalProducts,
            verifiedBrands,
            recentBrands
          );

    // Check for rating inconsistencies and log them
    let ratingInconsistencies = 0;
    brands.forEach((brand) => {
      if (brand.reviews && brand.reviews.length > 0) {
        const calculatedRating =
          brand.reviews.reduce(
            (sum: number, review: any) => sum + (review.rating || 0),
            0
          ) / brand.reviews.length;
        const storedRating = brand.rating || 0;

        if (Math.abs(calculatedRating - storedRating) > 0.1) {
          console.warn(
            `⚠️ Rating mismatch for ${brand.name}: stored=${storedRating}, calculated=${calculatedRating.toFixed(2)}`
          );
          ratingInconsistencies++;
        }
      }
    });

    if (ratingInconsistencies > 0) {
      console.warn(
        `⚠️ Found ${ratingInconsistencies} brands with rating inconsistencies. Consider running rating sync.`
      );
    }

    const analyticsData: AnalyticsData = {
      totalBrands,
      totalReviews,
      totalProducts,
      totalPageViews,
      activeBrands,
      verifiedBrands,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      recentReviews,
      recentBrands,
    };

    console.log("✅ Analytics data fetched successfully:", {
      ...analyticsData,
      ratingInconsistencies,
      pageViewsSource: realPageViews !== null ? "Real Analytics" : "Estimated",
    });

    return analyticsData;
  } catch (error) {
    console.error("❌ Error fetching analytics data:", error);
    throw error;
  }
}

/**
 * Sync brand ratings with their review averages
 * This function fixes rating inconsistencies
 */
export async function syncBrandRatings(): Promise<{
  updated: number;
  errors: number;
}> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    console.log("🔄 Syncing brand ratings...");

    // Get all brands with their reviews
    const { data: brands, error } = await supabase.from("brands").select(`
        id, 
        name, 
        rating,
        reviews:reviews(rating)
      `);

    if (error) throw error;

    let updated = 0;
    let errors = 0;

    for (const brand of brands || []) {
      if (brand.reviews && brand.reviews.length > 0) {
        // Calculate accurate average
        const calculatedRating =
          brand.reviews.reduce(
            (sum: number, review: any) => sum + (review.rating || 0),
            0
          ) / brand.reviews.length;

        const roundedRating = Math.round(calculatedRating * 10) / 10;

        // Update if there's a significant difference
        if (Math.abs(roundedRating - (brand.rating || 0)) > 0.05) {
          const { error: updateError } = await supabase
            .from("brands")
            .update({ rating: roundedRating })
            .eq("id", brand.id);

          if (updateError) {
            console.error(
              `❌ Error updating rating for ${brand.name}:`,
              updateError
            );
            errors++;
          } else {
            console.log(
              `✅ Updated ${brand.name}: ${brand.rating} → ${roundedRating}`
            );
            updated++;
          }
        }
      }
    }

    console.log(
      `✅ Rating sync complete: ${updated} updated, ${errors} errors`
    );
    return { updated, errors };
  } catch (error) {
    console.error("❌ Error syncing brand ratings:", error);
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

/**
 * Get analytics data filtered for a specific brand owner
 */
export async function getBrandOwnerAnalyticsData(
  ownedBrandIds: string[]
): Promise<AnalyticsData> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    console.log(
      "🔄 Fetching brand owner analytics data for brands:",
      ownedBrandIds
    );

    if (!ownedBrandIds || ownedBrandIds.length === 0) {
      // Return empty analytics if no brands owned
      return {
        totalBrands: 0,
        totalReviews: 0,
        totalProducts: 0,
        totalPageViews: 0,
        activeBrands: 0,
        verifiedBrands: 0,
        averageRating: 0,
        recentReviews: 0,
        recentBrands: 0,
      };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    // Fetch data filtered by owned brands
    const [brandsResult, reviewsResult, productsResult, recentReviewsResult] =
      await Promise.all([
        // Owned brands with their review counts
        supabase
          .from("brands")
          .select(
            `
          id, 
          name, 
          rating, 
          is_verified, 
          created_at,
          reviews:reviews(rating, created_at)
        `
          )
          .in("id", ownedBrandIds),

        // Reviews for owned brands only
        supabase
          .from("reviews")
          .select("id, rating, created_at, brand_id")
          .in("brand_id", ownedBrandIds),

        // Products for owned brands only
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .in("brand_id", ownedBrandIds),

        // Recent reviews for owned brands (last 30 days)
        supabase
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .in("brand_id", ownedBrandIds)
          .gte("created_at", thirtyDaysAgoISO),
      ]);

    // Handle errors
    if (brandsResult.error) throw brandsResult.error;
    if (reviewsResult.error) throw reviewsResult.error;
    if (productsResult.error) throw productsResult.error;
    if (recentReviewsResult.error) throw recentReviewsResult.error;

    // Process brands data
    const brands = brandsResult.data || [];
    const totalBrands = brands.length;
    const verifiedBrands = brands.filter((brand) => brand.is_verified).length;

    // All owned brands are considered "active" for brand owners
    const activeBrands = totalBrands;

    // Process reviews data
    const reviews = reviewsResult.data || [];
    const totalReviews = reviews.length;

    // Calculate average rating from all reviews for owned brands
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
          reviews.length
        : 0;

    // Get counts
    const totalProducts = productsResult.count || 0;
    const recentReviews = recentReviewsResult.count || 0;
    const recentBrands = 0; // Brand owners don't create new brands frequently

    // Calculate estimated page views for owned brands only
    // Use a more conservative multiplier since it's brand-specific
    const totalPageViews = Math.round(
      totalBrands * 15 +
        totalReviews * 5 +
        totalProducts * 10 +
        verifiedBrands * 30
    );

    const analyticsData: AnalyticsData = {
      totalBrands,
      totalReviews,
      totalProducts,
      totalPageViews,
      activeBrands,
      verifiedBrands,
      averageRating,
      recentReviews,
      recentBrands,
    };

    console.log("✅ Brand owner analytics data fetched:", analyticsData);
    return analyticsData;
  } catch (error) {
    console.error("❌ Error fetching brand owner analytics:", error);
    throw error;
  }
}

/**
 * Get brand growth data filtered for specific brands (shows collection growth instead)
 */
export async function getBrandOwnerGrowthData(
  ownedBrandIds: string[]
): Promise<{ month: string; brands: number }[]> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    if (!ownedBrandIds || ownedBrandIds.length === 0) {
      return [];
    }

    console.log(
      "🔄 Fetching brand owner growth data for brands:",
      ownedBrandIds
    );

    // For brand owners, growth is typically about collections/products, not new brands
    // So we'll show collection growth instead
    const { data, error } = await supabase
      .from("products")
      .select("created_at")
      .in("brand_id", ownedBrandIds)
      .order("created_at");

    if (error) throw error;

    // Group by month for the last 6 months
    const months: { date: Date; month: string; products: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        date,
        month: date.toLocaleDateString("en-US", { month: "short" }),
        products: 0,
      });
    }

    // Count products by month
    (data || []).forEach((product) => {
      const createdDate = new Date(product.created_at);
      const monthIndex = months.findIndex(
        (m) =>
          m.date.getMonth() === createdDate.getMonth() &&
          m.date.getFullYear() === createdDate.getFullYear()
      );
      if (monthIndex !== -1) {
        months[monthIndex].products++;
      }
    });

    // Convert to cumulative count (total products up to each month)
    let cumulative = 0;
    return months.map((month) => {
      cumulative += month.products;
      return {
        month: month.month,
        brands: cumulative, // Using 'brands' key for consistency with existing interface
      };
    });
  } catch (error) {
    console.error("❌ Error fetching brand owner growth data:", error);
    return [];
  }
}

/**
 * Get review trends data filtered for specific brands
 */
export async function getBrandOwnerReviewTrends(
  ownedBrandIds: string[]
): Promise<{ month: string; reviews: number; avgRating: number }[]> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    if (!ownedBrandIds || ownedBrandIds.length === 0) {
      return [];
    }

    console.log(
      "🔄 Fetching brand owner review trends for brands:",
      ownedBrandIds
    );

    const { data, error } = await supabase
      .from("reviews")
      .select("created_at, rating")
      .in("brand_id", ownedBrandIds)
      .order("created_at");

    if (error) throw error;

    // Group by month for the last 6 months
    const months: { date: Date; month: string; reviews: number[] }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        date,
        month: date.toLocaleDateString("en-US", { month: "short" }),
        reviews: [],
      });
    }

    // Group reviews by month
    (data || []).forEach((review) => {
      const createdDate = new Date(review.created_at);
      const monthIndex = months.findIndex(
        (m) =>
          m.date.getMonth() === createdDate.getMonth() &&
          m.date.getFullYear() === createdDate.getFullYear()
      );
      if (monthIndex !== -1) {
        months[monthIndex].reviews.push(review.rating);
      }
    });

    // Calculate monthly stats
    return months.map((month) => ({
      month: month.month,
      reviews: month.reviews.length,
      avgRating:
        month.reviews.length > 0
          ? month.reviews.reduce((sum, rating) => sum + rating, 0) /
            month.reviews.length
          : 0,
    }));
  } catch (error) {
    console.error("❌ Error fetching brand owner review trends:", error);
    return [];
  }
}

/**
 * Detect which analytics source is available and working
 * Returns the source name for display purposes
 */
export async function detectAnalyticsSource(): Promise<string> {
  try {
    // Try Google Analytics first
    const googleResponse = await fetch("/api/analytics/google", {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (googleResponse.ok) {
      const googleData = await googleResponse.json();
      if (
        googleData.pageViews !== null &&
        googleData.source === "google-analytics"
      ) {
        return "Google Analytics";
      }
    }

    // Try Vercel Analytics
    const vercelResponse = await fetch("/api/analytics/pageviews", {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (vercelResponse.ok) {
      const vercelData = await vercelResponse.json();
      if (vercelData.pageViews !== null && vercelData.source === "vercel") {
        return "Vercel Analytics";
      }
    }

    return "Estimated";
  } catch (error) {
    console.warn("Error detecting analytics source:", error);
    return "Estimated";
  }
}
