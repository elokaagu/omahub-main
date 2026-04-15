// Performance optimization service
import { ALLOWED_BRAND_PUBLIC_FIELDS } from "@/lib/validation/brandsOptimizedQuery";
import { supabase } from "../supabase";
import { normalizeProductImages } from "../utils/productImageUtils";
import { getAdminClientLazy } from "@/lib/supabase/adminClientLazy";

// Cache configuration
const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 60 * 60 * 1000, // 1 hour
};

// In-memory cache for frequently accessed data
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Cache utilities
export const cacheUtils = {
  set: (key: string, data: any, ttl: number = CACHE_DURATION.MEDIUM) => {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  },

  get: (key: string) => {
    const cached = cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      cache.delete(key);
      return null;
    }

    return cached.data;
  },

  clear: (pattern?: string) => {
    if (pattern) {
      for (const key of cache.keys()) {
        if (key.includes(pattern)) {
          cache.delete(key);
        }
      }
    } else {
      cache.clear();
    }
  },

  size: () => cache.size,
};

// Optimized data fetching with caching
export const performanceService = {
  // Get brands with caching and minimal fields
  async getBrandsOptimized(
    options: {
      fields?: string[];
      limit?: number;
      category?: string;
      useCache?: boolean;
    } = {}
  ) {
    const DEFAULT_FIELDS = [
      "id",
      "name",
      "image",
      "category",
      "location",
      "is_verified",
    ];

    const rawFields = options.fields;
    let fields =
      rawFields && rawFields.length > 0
        ? rawFields.filter((f) => ALLOWED_BRAND_PUBLIC_FIELDS.has(f))
        : DEFAULT_FIELDS;
    if (fields.length === 0) {
      fields = DEFAULT_FIELDS;
    }

    const limit = options.limit ?? 50;
    const category = options.category;
    const useCache = options.useCache ?? true;

    const cacheKey = `brands_${category || "all"}_${limit}_${fields.join(",")}`;

    if (useCache) {
      const cached = cacheUtils.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      let query = supabase
        .from("brands")
        .select(fields.join(", "))
        .limit(limit);

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        return [];
      }

      // Filter out brands with unapproved applications
      const supabaseAdmin = await getAdminClientLazy();
      if (supabaseAdmin) {
        const { data: unapprovedApps } = await supabaseAdmin
          .from("designer_applications")
          .select("brand_name, email")
          .neq("status", "approved");

        if (unapprovedApps && unapprovedApps.length > 0) {
          const unapprovedKeys = new Set(
            unapprovedApps.map((app) => `${app.brand_name}::${app.email}`)
          );

          // Fetch brands to get contact_email for matching
          const brandIds = data.map((b: any) => b.id).filter(Boolean);
          if (brandIds.length > 0) {
            const { data: brands } = await supabaseAdmin
              .from("brands")
              .select("id, name, contact_email")
              .in("id", brandIds);

            const unapprovedBrandIds = new Set(
              (brands || [])
                .filter((b) => {
                  if (!b.contact_email) return false;
                  const key = `${b.name}::${b.contact_email}`;
                  return unapprovedKeys.has(key);
                })
                .map((b) => b.id)
            );

            const filtered = data.filter(
              (brand: any) => !unapprovedBrandIds.has(brand.id)
            );

            if (useCache) {
              cacheUtils.set(cacheKey, filtered, CACHE_DURATION.MEDIUM);
            }

            return filtered;
          }
        }
      }

      if (useCache) {
        cacheUtils.set(cacheKey, data, CACHE_DURATION.MEDIUM);
      }

      return data;
    } catch (error) {
      console.error("Error fetching optimized brands:", error);
      return [];
    }
  },

  // Get products with pagination and caching
  async getProductsOptimized(
    options: {
      brandId?: string;
      category?: string;
      limit?: number;
      offset?: number;
      fields?: string[];
      useCache?: boolean;
    } = {}
  ) {
    const {
      brandId,
      category,
      limit = 20,
      offset = 0,
      fields = ["id", "title", "image", "price", "sale_price", "category"],
      useCache = true,
    } = options;

    const cacheKey = `products_${brandId || "all"}_${category || "all"}_${limit}_${offset}`;

    if (useCache) {
      const cached = cacheUtils.get(cacheKey);
      if (cached) {
        console.log("🎯 Using cached products data");
        return cached;
      }
    }

    try {
      let query = supabase
        .from("products")
        .select(fields.join(", "))
        .eq("in_stock", true)
        .range(offset, offset + limit - 1)
        .order("created_at", { ascending: false });

      if (brandId) {
        query = query.eq("brand_id", brandId);
      }

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (useCache) {
        cacheUtils.set(cacheKey, data, CACHE_DURATION.SHORT);
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching optimized products:", error);
      return [];
    }
  },

  // Get collections with minimal data
  async getCollectionsOptimized(
    options: {
      limit?: number;
      fields?: string[];
      useCache?: boolean;
    } = {}
  ) {
    const {
      limit = 20,
      fields = ["id", "title", "image", "description", "brand_id"],
      useCache = true,
    } = options;

    const cacheKey = `collections_${limit}_${fields.join(",")}`;

    if (useCache) {
      const cached = cacheUtils.get(cacheKey);
      if (cached) {
        console.log("🎯 Using cached collections data");
        return cached;
      }
    }

    try {
      const { data, error } = await supabase
        .from("catalogues")
        .select(fields.join(", "))
        .limit(limit)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (useCache) {
        cacheUtils.set(cacheKey, data, CACHE_DURATION.MEDIUM);
      }

      return data;
    } catch (error) {
      console.error("Error fetching optimized collections:", error);
      return [];
    }
  },

  // Optimize image URLs for better performance
  optimizeImageUrl(
    url: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: "webp" | "avif" | "jpeg";
    } = {}
  ) {
    if (!url) return url;

    const { width, height, quality = 85, format = "webp" } = options;

    // For Supabase storage URLs
    if (url.includes("/storage/v1/object/public/")) {
      const params = new URLSearchParams();

      if (width) params.append("width", width.toString());
      if (height) params.append("height", height.toString());
      params.append("quality", quality.toString());
      params.append("format", format);

      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}${params.toString()}`;
    }

    return url;
  },

  // Batch operations for better performance
  async batchOperation<T>(
    items: T[],
    operation: (item: T) => Promise<any>,
    batchSize: number = 5
  ) {
    const results = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(batch.map(operation));
      results.push(...batchResults);
    }

    return results;
  },

  // Performance monitoring
  async measurePerformance<T>(
    operation: () => Promise<T>,
    label: string
  ): Promise<T> {
    const start = performance.now();

    try {
      const result = await operation();
      const end = performance.now();
      const duration = end - start;

      if (process.env.NODE_ENV !== "production") {
        console.log(`⏱️ ${label}: ${Math.round(duration)}ms`);
        if (duration > 1000) {
          console.warn(
            `🐌 Slow operation detected: ${label} took ${Math.round(duration)}ms`
          );
        }
      } else if (duration > 3000) {
        console.warn(
          JSON.stringify({
            event: "slow_operation",
            label,
            ms: Math.round(duration),
          })
        );
      }

      return result;
    } catch (error) {
      const end = performance.now();
      const duration = end - start;
      console.error(
        JSON.stringify({
          event: "operation_failed",
          label,
          ms: Math.round(duration),
          message: error instanceof Error ? error.message : String(error),
        })
      );
      throw error;
    }
  },

  // Get cache statistics
  getCacheStats() {
    const stats = {
      size: cache.size,
      keys: Array.from(cache.keys()),
      memoryUsage: JSON.stringify(Array.from(cache.entries())).length,
    };

    console.log("📊 Cache Stats:", stats);
    return stats;
  },

  // Clear expired cache entries
  cleanupCache() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        cache.delete(key);
        cleaned++;
      }
    }

    console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    return cleaned;
  },
};

// Auto-cleanup cache every 10 minutes with proper cleanup
let cleanupInterval: NodeJS.Timeout | null = null;

if (typeof window !== "undefined") {
  cleanupInterval = setInterval(
    () => {
      performanceService.cleanupCache();
    },
    10 * 60 * 1000
  );

  // Cleanup on page unload to prevent memory leaks
  window.addEventListener("beforeunload", () => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
    }
  });
}

export default performanceService;
