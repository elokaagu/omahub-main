import { supabase, Brand, Review, Catalogue, Product } from "../supabase";
import { getProfile, isAdmin } from "./authService";

import { clearCollectionsCache } from "./collectionService";

/**
 * Unified Brand Service - Consolidates all brand-related functions
 * Replaces: getAllBrands, getBrandsByCategory, getBrandsOptimized, etc.
 */

interface BrandFetchOptions {
  // Filtering options
  category?: string;
  filterEmptyBrands?: boolean;
  limit?: number;
  offset?: number;
  
  // Field selection options
  fields?: string[];
  includeImages?: boolean;
  includeProducts?: boolean;
  includeCollections?: boolean;
  
  // Caching options
  useCache?: boolean;
  forceRefresh?: boolean;
  
  // Sorting options
  sortBy?: 'name' | 'created_at' | 'rating' | 'is_verified';
  sortOrder?: 'asc' | 'desc';
}

interface BrandWithRelations extends Brand {
  product_count?: number;
  collections?: Catalogue[];
  reviews?: Review[];
}

// Enhanced cache with better invalidation
interface EnhancedBrandsCache {
  data: BrandWithRelations[] | null;
  timestamp: number;
  isLoading: boolean;
  filters: string; // Cache key based on filters
}

let enhancedBrandsCache: EnhancedBrandsCache = {
  data: null,
  timestamp: 0,
  isLoading: false,
  filters: '',
};

const ENHANCED_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * Check if user has permission to modify a brand
 */
async function hasPermission(
  userId: string,
  brandId: string
): Promise<boolean> {
  const profile = await getProfile(userId);

  if (!profile) return false;

  // Super admins and admins have permission to all brands
  if (profile.role === "admin" || profile.role === "super_admin") return true;

  // Brand admins only have permission to their owned brands
  if (profile.role === "brand_admin") {
    return profile.owned_brands?.includes(brandId) || false;
  }

  return false;
}

/**
 * Fetch all brands with product counts
 */
export async function getAllBrandsWithProductCounts(): Promise<
  (Brand & { product_count: number })[]
> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    // Get brands with product counts using a join
    const { data, error } = await supabase
      .from("brands")
      .select(
        `
        *,
        products(count),
        brand_images(*)
      `
      )
      .order("name");

    if (error) {
      console.error("Error fetching brands with product counts:", error);
      throw error;
    }

    if (!data) {
      return [];
    }

    // Debug: Check if video fields are present in the raw data
    const brandsWithVideos = data.filter((brand: any) => brand.video_url);
    if (brandsWithVideos.length > 0) {
      console.log(
        "🎬 Brands with videos:",
        brandsWithVideos.map((b: any) => ({
          name: b.name,
          video_url: b.video_url,
          video_thumbnail: b.video_thumbnail,
        }))
      );
    }

    // Map the data to include product_count and video fields
    const brandsWithCounts: (Brand & { product_count: number })[] = data.map(
      (item) => ({
        id: item.id || `temp-id-${Math.random().toString(36).substring(2, 9)}`,
        name: item.name || "Brand Name",
        description: item.description || "Brand description",
        long_description: item.long_description || "Long brand description",
        location: item.location || "Unknown location",
        price_range: item.price_range || "$",
        currency: item.currency,
        category: item.category || "Other",
        categories: item.categories || [],
        rating: item.rating || 4.5,
        is_verified: item.is_verified || false,
        // Construct image URL from brand_images relationship
        image: item.brand_images?.[0]?.storage_path
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/${item.brand_images[0].storage_path}`
          : item.image || "/placeholder-image.jpg", // Fallback to old image field for backward compatibility
        product_count: item.products?.[0]?.count || 0,
        // Include video fields
        video_url: item.video_url || undefined,
        video_thumbnail: item.video_thumbnail || undefined,
      })
    );

    return brandsWithCounts;
  } catch (err) {
    console.error("Error in getAllBrandsWithProductCounts:", err);
    throw err;
  }
}

/**
 * Unified function to fetch brands with flexible options
 * Replaces: getAllBrands, getBrandsByCategory, getBrandsOptimized
 */
export async function getBrands(options: BrandFetchOptions = {}): Promise<BrandWithRelations[]> {
  const {
    category,
    filterEmptyBrands = false,
    limit,
    offset = 0,
    fields = ['*'],
    includeImages = true,
    includeProducts = false,
    includeCollections = false,
    useCache = true,
    forceRefresh = false,
    sortBy = 'name',
    sortOrder = 'asc'
  } = options;

  // Create cache key based on options
  const cacheKey = JSON.stringify({
    category,
    filterEmptyBrands,
    limit,
    offset,
    fields: fields.sort(),
    includeImages,
    includeProducts,
    includeCollections,
    sortBy,
    sortOrder
  });

  // Check cache first (unless forcing refresh)
  if (useCache && !forceRefresh && enhancedBrandsCache.data && enhancedBrandsCache.filters === cacheKey) {
    const now = Date.now();
    if (now - enhancedBrandsCache.timestamp < ENHANCED_CACHE_EXPIRY) {
      console.log("🎯 Using cached brands data");
      return enhancedBrandsCache.data;
    }
  }

  // Prevent concurrent fetches with same options
  if (enhancedBrandsCache.isLoading && enhancedBrandsCache.filters === cacheKey) {
    console.log("🔄 Already fetching brands with same options, waiting...");
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (enhancedBrandsCache.data && enhancedBrandsCache.filters === cacheKey) {
      return enhancedBrandsCache.data;
    }
  }

  try {
    enhancedBrandsCache.isLoading = true;
    console.log("🔄 Fetching brands with options:", options);

    if (!supabase) {
      throw new Error("Supabase client is not initialized");
    }

    // Build the base query
    let selectFields = fields.includes('*') ? '*' : fields.join(', ');
    
    // Always include essential fields for processing
    if (!fields.includes('*')) {
      const essentialFields = ['id', 'name', 'category', 'location'];
      essentialFields.forEach(field => {
        if (!selectFields.includes(field)) {
          selectFields += `, ${field}`;
        }
      });
    }

    // Build the query
    let query = supabase
      .from("brands")
      .select(selectFields);

    // Apply filters
    if (category) {
      query = query.eq("category", category);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    if (limit) {
      query = query.range(offset, offset + limit - 1);
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch brands: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log("⚠️ No brands found with current filters");
      return [];
    }

    // Process the data
    let processedBrands: BrandWithRelations[] = data.map((item: any) => {
      // Clean location data
      const cleanLocation = item.location
        ? item.location.replace(/[O0]+$/, "")
        : undefined;

      if (item.location && cleanLocation !== item.location) {
        console.log(
          `🧹 Cleaned location for ${item.name}: '${item.location}' → '${cleanLocation}'`
        );
      }

      return {
        id: item.id || `temp-id-${Math.random().toString(36).substring(2, 9)}`,
        name: item.name || "Brand Name",
        description: item.description || "Brand description",
        long_description: item.long_description || "Long brand description",
        location: cleanLocation || "Unknown location",
        price_range: item.price_range || "$",
        currency: item.currency,
        category: item.category || "Other",
        categories: item.categories || [],
        rating: item.rating || 4.5,
        is_verified: item.is_verified || false,
        image: item.image || "/placeholder-image.jpg",
        video_url: item.video_url,
        video_thumbnail: item.video_thumbnail,
        created_at: item.created_at,
        updated_at: item.updated_at,
      };
    });

    // Apply additional filters
    if (filterEmptyBrands) {
      console.log("🔍 Filtering out brands with no products...");
      const brandsWithCounts = await getAllBrandsWithProductCounts();
      const brandCountsMap = new Map(
        brandsWithCounts.map(brand => [brand.id, brand.product_count || 0])
      );
      
      processedBrands = processedBrands.filter(brand => {
        const count = brandCountsMap.get(brand.id) || 0;
        brand.product_count = count;
        return count > 0;
      });
      
      console.log(`✅ Filtered to ${processedBrands.length} brands with products`);
    }

    // Update cache
    enhancedBrandsCache = {
      data: processedBrands,
      timestamp: Date.now(),
      isLoading: false,
      filters: cacheKey,
    };

    console.log(`✅ Successfully fetched ${processedBrands.length} brands`);
    return processedBrands;

  } catch (error) {
    console.error("⛔ Error in unified getBrands:", error);
    enhancedBrandsCache.isLoading = false;
    
    // Return sample data as fallback
    console.log("⚠️ Using sample data as fallback");
    return getSampleBrandsData();
  }
}

/**
 * Convenience function for getting all brands (backward compatibility)
 * @deprecated Use getBrands() instead
 */
export async function getAllBrands(
  filterEmptyBrands: boolean = false,
  noCache: boolean = false
): Promise<Brand[]> {
  console.warn("⚠️ getAllBrands is deprecated. Use getBrands() instead.");
  
  return getBrands({
    filterEmptyBrands,
    forceRefresh: noCache,
    useCache: !noCache
  });
}

/**
 * Convenience function for getting brands by category (backward compatibility)
 * @deprecated Use getBrands({ category: '...' }) instead
 */
export async function getBrandsByCategory(category: string): Promise<Brand[]> {
  console.warn("⚠️ getBrandsByCategory is deprecated. Use getBrands({ category: '...' }) instead.");
  
  return getBrands({ category });
}

/**
 * Get brands with minimal fields for performance (replaces getBrandsOptimized)
 */
export async function getBrandsOptimized(options: {
  fields?: string[];
  limit?: number;
  category?: string;
  useCache?: boolean;
} = {}): Promise<Brand[]> {
  console.warn("⚠️ getBrandsOptimized is deprecated. Use getBrands() with options instead.");
  
  const { fields = ["id", "name", "image", "category", "location", "is_verified"], limit, category, useCache } = options;
  
  return getBrands({
    fields,
    limit,
    category,
    useCache,
    includeImages: false,
    includeProducts: false
  });
}

/**
 * Function to provide sample data in case of database connection issues
 */
function getSampleBrandsData(): Brand[] {
  console.log("⚠️ Using sample brand data as fallback");
  return [
    {
      id: "sample-brand-1",
      name: "Adiree",
      description: "Contemporary African fashion",
      long_description:
        "Adiree creates contemporary fashion with African inspiration.",
      location: "Lagos",
      price_range: "$",
      currency: "USD",
      category: "Ready to Wear",
      rating: 4.8,
      is_verified: true,
      brand_images: [],
      video_url: undefined,
      video_thumbnail: undefined,
    },
    {
      id: "sample-brand-2",
      name: "Imad Eduso",
      description: "Luxury bridal wear",
      long_description: "Luxury bridal wear with a modern African twist.",
      location: "Lagos",
      price_range: "$",
      currency: "USD",
      category: "Bridal",
      rating: 5.0,
      is_verified: true,
      brand_images: [],
      video_url: undefined,
      video_thumbnail: undefined,
    },
    {
      id: "sample-brand-3",
      name: "Emmy Kasbit",
      description: "Contemporary tailored",
      long_description:
        "Contemporary tailored with a focus on quality and detail.",
      location: "Accra",
      price_range: "$",
      currency: "USD",
      category: "Tailored",
      rating: 4.6,
      is_verified: true,
      brand_images: [],
      video_url: undefined,
      video_thumbnail: undefined,
    },
    {
      id: "sample-brand-4",
      name: "Shekudo",
      description: "Handcrafted accessories",
      long_description: "Handcrafted accessories made with local materials.",
      location: "Nairobi",
      price_range: "$",
      currency: "USD",
      category: "Accessories",
      rating: 4.7,
      is_verified: true,
      brand_images: [],
      video_url: undefined,
      video_thumbnail: undefined,
    },
  ];
}

/**
 * Clear the brands cache to force a fresh fetch
 */
export function clearBrandsCache(): void {
  console.log("Clearing brands cache");
  enhancedBrandsCache = {
    data: null,
    timestamp: 0,
    isLoading: false,
    filters: '',
  };
}

/**
 * Clear all caches that depend on brand data
 */
export function clearAllBrandDependentCaches(): void {
  clearBrandsCache();
  clearCollectionsCache();
  console.log("🧹 All brand-dependent caches cleared");
}

export async function forceRefreshBrands(
  filterEmptyBrands: boolean = false
): Promise<Brand[]> {
  console.log("Force refreshing brands data");
  clearBrandsCache();
  return getBrands({ filterEmptyBrands, forceRefresh: true });
}

/**
 * Fetch a single brand by ID
 */
export async function getBrandById(id: string): Promise<Brand | null> {
  if (!supabase) {
    console.error("Supabase client not available");
    return null;
  }

  console.log(`Attempting to fetch brand with ID: "${id}"`);

  // First try with the original ID as-is, including brand_images relationship
  let { data, error } = await supabase
    .from("brands")
    .select("*, brand_images(*)")
    .eq("id", id)
    .single();

  if (!error && data) {
    // Clean location data - remove trailing 'O' and '0' characters that might be data entry errors
    if (data.location) {
      const cleanLocation = data.location.replace(/[O0]+$/, "");
      if (cleanLocation !== data.location) {
        console.log(
          `🧹 Cleaned location for ${data.name}: '${data.location}' → '${cleanLocation}'`
        );
        data.location = cleanLocation;
      }
    }

    console.log(`Successfully fetched brand: ${data.name} (${data.id})`);
    return data;
  }

  // If that fails, try with normalized ID (same logic as brand creation)
  const normalizedId = id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  console.log(
    `Original ID "${id}" not found, trying normalized: "${normalizedId}"`
  );

  ({ data, error } = await supabase
    .from("brands")
    .select("*, brand_images(*)")
    .eq("id", normalizedId)
    .single());

  if (error) {
    console.error(
      `Error fetching brand ${id} (normalized: ${normalizedId}):`,
      error
    );
    return null;
  }

  if (!data) {
    console.log(
      `No brand found with ID: "${id}" or normalized: "${normalizedId}"`
    );
    return null;
  }

  // Clean location data - remove trailing 'O' and '0' characters that might be data entry errors
  if (data.location) {
    const cleanLocation = data.location.replace(/[O0]+$/, "");
    if (cleanLocation !== data.location) {
      console.log(
        `🧹 Cleaned location for ${data.name}: '${data.location}' → '${cleanLocation}'`
      );
      data.location = cleanLocation;
    }
  }

  console.log(`Successfully fetched brand: ${data.name} (${data.id})`);
  return data;
}

/**
 * Alias for getBrandById to match the naming in the brand edit page
 */
export const getBrand = getBrandById;

/**
 * Update a brand
 */
export async function updateBrand(
  userId: string,
  id: string,
  updates: Partial<Brand>
): Promise<Brand | null> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  // Check if user has permission to update this brand
  const hasAccess = await hasPermission(userId, id);
  if (!hasAccess) {
    throw new Error(
      "Unauthorized: You don't have permission to update this brand"
    );
  }

  const { data, error } = await supabase
    .from("brands")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating brand:", error);
    return null;
  }

  // Clear the brands cache to ensure fresh data after update
  clearBrandsCache();
  // Also clear collections cache since they depend on brand data
  clearCollectionsCache();
  console.log("🔄 Brands and collections cache cleared after brand update");

  return data;
}

/**
 * Delete a brand
 */
export async function deleteBrand(
  userId: string,
  id: string
): Promise<boolean> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  // Check if user has admin privileges (includes both admin and super_admin)
  const hasAdminAccess = await isAdmin(userId);
  if (!hasAdminAccess) {
    throw new Error(
      "Unauthorized: Only admins and super admins can delete brands"
    );
  }

  const { error } = await supabase.from("brands").delete().eq("id", id);

  if (error) {
    console.error("Error deleting brand:", error);
    return false;
  }

  return true;
}

/**
 * Fetch reviews for a brand
 */
export async function getBrandReviews(brandId: string): Promise<Review[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("brand_id", brandId);

  if (error) {
    console.error(`Error fetching reviews for brand ${brandId}:`, error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch catalogues for a brand
 */
export async function getBrandCollections(
  brandId: string
): Promise<Catalogue[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("catalogues")
    .select("*")
    .eq("brand_id", brandId);

  if (error) {
    console.error(`Error fetching catalogues for brand ${brandId}:`, error);
    throw error;
  }

  return data || [];
}

/**
 * Add a new review for a brand
 */
export async function addReview(
  review: Omit<Review, "id">
): Promise<Review | null> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert([review])
    .select()
    .single();

  if (error) {
    console.error("Error adding review:", error);
    throw error;
  }

  return data;
}

/**
 * Search brands by name or description
 */
export async function searchBrands(query: string): Promise<Brand[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("brands")
    .select("*, brand_images(*)")
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

  if (error) {
    console.error(`Error searching brands with query ${query}:`, error);
    throw error;
  }

  return data || [];
}

/**
 * Get products for a specific brand
 */
export async function getBrandProducts(brandId: string): Promise<Product[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Error fetching products for brand ${brandId}:`, error);
    throw error;
  }

  return data || [];
}

/**
 * Invalidate the brands cache (useful for tab switching scenarios)
 */
export function invalidateBrandsCache() {
  console.log("🗑️ Invalidating brands cache");
  enhancedBrandsCache = {
    data: null,
    timestamp: 0,
    isLoading: false,
    filters: '',
  };
}

/**
 * Fetch only brand IDs and names for lightweight operations
 * Use this when you only need to map brand IDs to names
 */
export async function getBrandNamesMap(): Promise<Map<string, string>> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    console.log("🔄 Fetching lightweight brand names map...");

    // Only select id and name for minimal payload
    const { data, error } = await supabase
      .from("brands")
      .select("id, name")
      .order("name");

    if (error) {
      console.error("Error fetching brand names:", error);
      throw error;
    }

    if (!data) {
      return new Map();
    }

    // Create and return the Map directly
    const brandMap = new Map(data.map((brand) => [brand.id, brand.name]));

    return brandMap;
  } catch (err) {
    console.error("Error in getBrandNamesMap:", err);
    throw err;
  }
}

/**
 * Fetch brands with tailoring enabled (i.e., brands that have a record in the tailors table)
 */
export async function getTailorBrands(): Promise<Brand[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  try {
    // Join brands with tailors on brand_id
    const { data, error } = await supabase
      .from("brands")
      .select("*", { count: "exact" })
      .in(
        "id",
        (await supabase.from("tailors").select("brand_id")).data?.map(
          (t: any) => t.brand_id
        ) || []
      );

    if (error) {
      console.error("Error fetching tailor brands:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getTailorBrands:", error);
    return [];
  }
}
