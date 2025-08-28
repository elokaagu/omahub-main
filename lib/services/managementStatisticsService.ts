import { supabase } from "@/lib/supabase";

export interface ManagementStatistic {
  id: string;
  metric_name: string;
  metric_value: number;
  last_updated: string;
  created_at: string;
}

export interface PlatformStatistics {
  total_brands: number;
  verified_brands: number;
  active_brands: number;
  total_reviews: number;
  total_products: number;
  last_updated: string;
}

/**
 * Get all management statistics
 */
export async function getManagementStatistics(): Promise<
  ManagementStatistic[]
> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    const { data, error } = await supabase
      .from("management_statistics")
      .select("*")
      .order("metric_name");

    if (error) {
      console.error("Error fetching management statistics:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getManagementStatistics:", error);
    throw error;
  }
}

/**
 * Get platform statistics in a structured format
 */
export async function getPlatformStatistics(): Promise<PlatformStatistics> {
  try {
    const statistics = await getManagementStatistics();

    const statsMap = statistics.reduce(
      (acc, stat) => {
        acc[stat.metric_name] = stat.metric_value;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get the most recent update time
    const lastUpdated = statistics.reduce((latest, stat) => {
      return new Date(stat.last_updated) > new Date(latest)
        ? stat.last_updated
        : latest;
    }, statistics[0]?.last_updated || new Date().toISOString());

    return {
      total_brands: statsMap.total_brands || 0,
      verified_brands: statsMap.verified_brands || 0,
      active_brands: statsMap.active_brands || 0,
      total_reviews: statsMap.total_reviews || 0,
      total_products: statsMap.total_products || 0,
      last_updated: lastUpdated,
    };
  } catch (error) {
    console.error("Error in getPlatformStatistics:", error);
    throw error;
  }
}

/**
 * Get a specific statistic by name
 */
export async function getStatisticByName(metricName: string): Promise<number> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    const { data, error } = await supabase
      .from("management_statistics")
      .select("metric_value")
      .eq("metric_name", metricName)
      .single();

    if (error) {
      console.error(`Error fetching statistic ${metricName}:`, error);
      throw error;
    }

    return data?.metric_value || 0;
  } catch (error) {
    console.error(`Error in getStatisticByName for ${metricName}:`, error);
    throw error;
  }
}

/**
 * Manually trigger statistics update (admin only)
 */
export async function updateStatistics(): Promise<void> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    // Call the database function to update statistics
    const { error } = await supabase.rpc("update_brand_statistics");

    if (error) {
      console.error("Error updating statistics:", error);
      throw error;
    }

    console.log("Statistics updated successfully");
  } catch (error) {
    console.error("Error in updateStatistics:", error);
    throw error;
  }
}

/**
 * Subscribe to statistics changes
 */
export function subscribeToStatistics(
  callback: (statistics: ManagementStatistic[]) => void
) {
  if (!supabase) {
    console.error("Supabase client not available for subscription");
    return null;
  }

  const subscription = supabase
    .channel("management_statistics_changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "management_statistics",
      },
      async () => {
        try {
          const statistics = await getManagementStatistics();
          callback(statistics);
        } catch (error) {
          console.error("Error fetching updated statistics:", error);
        }
      }
    )
    .subscribe();

  return subscription;
}

/**
 * Get statistics formatted for display
 */
export async function getFormattedStatistics(): Promise<
  {
    label: string;
    value: number;
    lastUpdated: string;
  }[]
> {
  try {
    const statistics = await getManagementStatistics();

    const labelMap: Record<string, string> = {
      total_brands: "Total Brands",
      verified_brands: "Verified Brands",
      active_brands: "Active Brands",
      total_reviews: "Total Reviews",
      total_products: "Total Products",
    };

    return statistics.map((stat: { metric_name: string; metric_value: number; last_updated: string }) => ({
      label: labelMap[stat.metric_name] || stat.metric_name,
      value: stat.metric_value,
      lastUpdated: stat.last_updated,
    }));
  } catch (error) {
    console.error("Error in getFormattedStatistics:", error);
    throw error;
  }
}

/**
 * Check if statistics are stale (older than 1 hour)
 */
export async function areStatisticsStale(): Promise<boolean> {
  try {
    const statistics = await getManagementStatistics();

    if (statistics.length === 0) {
      return true;
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    return statistics.some((stat) => new Date(stat.last_updated) < oneHourAgo);
  } catch (error) {
    console.error("Error checking if statistics are stale:", error);
    return true;
  }
}
