import { supabase } from "@/lib/supabase";

export interface BrandStatistics {
  total_brands: number;
  verified_brands: number;
  active_brands: number;
  total_reviews: number;
  total_products: number;
  last_updated: string;
}

/**
 * Calculate brand statistics from the database
 */
export async function calculateBrandStatistics(): Promise<BrandStatistics> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    // Get total brands count
    const { count: totalBrands } = await supabase
      .from("brands")
      .select("*", { count: "exact", head: true });

    // Get verified brands count
    const { count: verifiedBrands } = await supabase
      .from("brands")
      .select("*", { count: "exact", head: true })
      .eq("is_verified", true);

    // Get active brands (brands with reviews or created in last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: activeBrandsData } = await supabase
      .from("brands")
      .select("id, created_at")
      .or(`created_at.gte.${ninetyDaysAgo.toISOString()}`);

    // Get brands with reviews
    const { data: brandsWithReviews } = await supabase
      .from("reviews")
      .select("brand_id")
      .not("brand_id", "is", null);

    const uniqueBrandsWithReviews = new Set(
      brandsWithReviews?.map((r) => r.brand_id) || []
    );

    const recentBrands = new Set(activeBrandsData?.map((b) => b.id) || []);

    const activeBrandsSet = new Set([
      ...uniqueBrandsWithReviews,
      ...recentBrands,
    ]);

    // Get total reviews count
    const { count: totalReviews } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true });

    // Get total products count (if products table exists)
    let totalProducts = 0;
    try {
      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });
      totalProducts = productCount || 0;
    } catch (error) {
      // Products table might not exist
      console.log("Products table not found, setting count to 0");
    }

    return {
      total_brands: totalBrands || 0,
      verified_brands: verifiedBrands || 0,
      active_brands: activeBrandsSet.size,
      total_reviews: totalReviews || 0,
      total_products: totalProducts,
      last_updated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error calculating brand statistics:", error);
    throw error;
  }
}

/**
 * Get cached statistics or calculate fresh ones
 */
export async function getBrandStatistics(
  useCache = true
): Promise<BrandStatistics> {
  try {
    if (useCache) {
      // Try to get from localStorage first (client-side caching)
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("brand_statistics");
        if (cached) {
          const parsedCache = JSON.parse(cached);
          const cacheAge =
            Date.now() - new Date(parsedCache.last_updated).getTime();

          // Use cache if less than 5 minutes old
          if (cacheAge < 5 * 60 * 1000) {
            return parsedCache;
          }
        }
      }
    }

    // Calculate fresh statistics
    const statistics = await calculateBrandStatistics();

    // Cache the results (client-side)
    if (typeof window !== "undefined") {
      localStorage.setItem("brand_statistics", JSON.stringify(statistics));
    }

    return statistics;
  } catch (error) {
    console.error("Error getting brand statistics:", error);
    throw error;
  }
}

/**
 * Update statistics after brand operations
 */
export async function updateStatisticsAfterBrandChange(): Promise<void> {
  try {
    // Clear cache
    if (typeof window !== "undefined") {
      localStorage.removeItem("brand_statistics");
    }

    // Calculate fresh statistics
    await calculateBrandStatistics();

    console.log("Brand statistics updated after brand change");
  } catch (error) {
    console.error("Error updating statistics after brand change:", error);
  }
}

/**
 * Get formatted statistics for display
 */
export async function getFormattedBrandStatistics(): Promise<
  {
    label: string;
    value: number;
    percentage?: number;
    icon: string;
  }[]
> {
  try {
    const stats = await getBrandStatistics();

    return [
      {
        label: "Total Brands",
        value: stats.total_brands,
        icon: "Users",
      },
      {
        label: "Verified Brands",
        value: stats.verified_brands,
        percentage:
          stats.total_brands > 0
            ? Math.round((stats.verified_brands / stats.total_brands) * 100)
            : 0,
        icon: "CheckCircle",
      },
      {
        label: "Active Brands",
        value: stats.active_brands,
        percentage:
          stats.total_brands > 0
            ? Math.round((stats.active_brands / stats.total_brands) * 100)
            : 0,
        icon: "TrendingUp",
      },
      {
        label: "Total Reviews",
        value: stats.total_reviews,
        icon: "MessageSquare",
      },
      {
        label: "Total Products",
        value: stats.total_products,
        icon: "Package",
      },
    ];
  } catch (error) {
    console.error("Error getting formatted brand statistics:", error);
    throw error;
  }
}

/**
 * Subscribe to brand changes and update statistics
 */
export function subscribeToBrandChanges(
  callback: (statistics: BrandStatistics) => void
) {
  if (!supabase) {
    console.error("Supabase client not available for subscription");
    return null;
  }

  const subscription = supabase
    .channel("brand_statistics_changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "brands",
      },
      async () => {
        try {
          // Clear cache and get fresh statistics
          if (typeof window !== "undefined") {
            localStorage.removeItem("brand_statistics");
          }

          const statistics = await calculateBrandStatistics();
          callback(statistics);
        } catch (error) {
          console.error("Error updating statistics after brand change:", error);
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "reviews",
      },
      async () => {
        try {
          // Clear cache and get fresh statistics
          if (typeof window !== "undefined") {
            localStorage.removeItem("brand_statistics");
          }

          const statistics = await calculateBrandStatistics();
          callback(statistics);
        } catch (error) {
          console.error(
            "Error updating statistics after review change:",
            error
          );
        }
      }
    )
    .subscribe();

  return subscription;
}
