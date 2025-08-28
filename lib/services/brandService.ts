import { supabase, Brand, Review, Catalogue, Product } from "../supabase";
import { getProfile, isAdmin } from "./authService";

import { clearCollectionsCache } from "./collectionService";

// Cache configuration
let brandsCache: {
  data: Brand[] | null;
  timestamp: number;
  isLoading: boolean;
} = {
  data: null,
  timestamp: 0,
  isLoading: false,
};

// Cache expiration time (restored to reasonable value)
const CACHE_EXPIRY = 30 * 1000; // 30 seconds for stable performance

// Define essential fields to reduce payload size
const ESSENTIAL_BRAND_FIELDS = "*";

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
      (item: { id?: string; name?: string; description?: string; long_description?: string; location?: string; price_range?: string; currency?: string; category?: string; categories?: string[]; rating?: number; is_verified?: boolean; image?: string; brand_images?: any[]; products?: any[]; video_url?: string; video_thumbnail?: string }) => ({
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
 * Fetch all brands, optionally filtering out those with no products
 */
export async function getAllBrands(
  filterEmptyBrands: boolean = false,
  noCache: boolean = false
): Promise<Brand[]> {
  try {
    if (filterEmptyBrands) {
      // Get brands with product counts and filter out empty ones
      const brandsWithCounts = await getAllBrandsWithProductCounts();
      return brandsWithCounts.filter((brand) => brand.product_count > 0);
    }

    // If noCache is true, always fetch fresh data
    if (noCache) {
      if (!supabase) {
        throw new Error("Supabase client is not initialized");
      }
      const { data, error } = await supabase
        .from("brands")
        .select("*, video_url, video_thumbnail, brand_images(*)")
        .order("name");
      if (error) throw new Error(`Failed to fetch brands: ${error.message}`);
      if (!data || data.length === 0)
        throw new Error("No brands found in the database");
      return data.map((item: { id?: string; name?: string; description?: string; long_description?: string; location?: string; price_range?: string; currency?: string; category?: string; categories?: string[]; rating?: number; is_verified?: boolean; image?: string; brand_images?: any[]; video_url?: string; video_thumbnail?: string }) => {
        // Clean location data - remove trailing 'O' and '0' characters that might be data entry errors
        const cleanLocation = item.location
          ? item.location.replace(/[O0]+$/, "")
          : undefined;
        if (item.location && cleanLocation !== item.location) {
          console.log(
            `🧹 Cleaned location for ${item.name}: '${item.location}' → '${cleanLocation}'`
          );
        }

        return {
          id:
            item.id || `temp-id-${Math.random().toString(36).substring(2, 9)}`,
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
          // Construct image URL from brand_images relationship
          image: item.brand_images?.[0]?.storage_path
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/${item.brand_images[0].storage_path}`
            : item.image || "/placeholder-image.jpg", // Fallback to old image field for backward compatibility
          video_url: item.video_url || undefined,
          video_thumbnail: item.video_thumbnail || undefined,
        };
      });
    }

    // Check if we're already loading brands
    if (brandsCache.isLoading) {
      console.log("🔄 Already fetching brands, waiting for completion...");
      // Wait for a short period and check cache
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Increased to 2 seconds
      if (brandsCache.data) {
        console.log("✅ Got data from cache after waiting");
        return brandsCache.data;
      }
      console.log("⚠️ No data in cache after waiting, using sample data");
      return getSampleBrandsData();
    }

    // Check cache first
    const now = Date.now();
    if (brandsCache.data && now - brandsCache.timestamp < CACHE_EXPIRY) {
      console.log(
        "🎯 Using cached brands data, age:",
        (now - brandsCache.timestamp) / 1000,
        "seconds"
      );
      return brandsCache.data;
    }

    // Set loading state
    brandsCache.isLoading = true;
    console.log("🔄 Cache expired or empty, fetching fresh data...");

    // Debug Supabase connection
    if (!supabase) {
      console.error("⛔ ERROR: Supabase client is undefined!");
      brandsCache.isLoading = false;
      throw new Error("Supabase client is not initialized");
    }

    // Test connection with a count query first
    const { count, error: countError } = await supabase
      .from("brands")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("⛔ Error testing database connection:", countError);
      brandsCache.isLoading = false;
      throw new Error(`Database connection error: ${countError.message}`);
    }

    console.log(`📊 Found ${count} brands in database`);

    // Fetch all brand data with their normalized images
    const { data, error } = await supabase
      .from("brands")
      .select(
        `
        *,
        video_url,
        video_thumbnail,
        brand_images (
          id,
          role,
          storage_path,
          created_at,
          updated_at
        )
      `
      )
      .order("name");

    if (error) {
      console.error(
        "⛔ Error fetching brands:",
        error.message,
        error.details,
        error.hint,
        "\nStatus:",
        error.code
      );
      brandsCache.isLoading = false;
      throw new Error(`Failed to fetch brands: ${error.message}`);
    }

    if (!data || data.length === 0) {
      brandsCache.isLoading = false;
      throw new Error("No brands found in the database");
    }

    // Map the data to Brand objects
    const fullBrands: Brand[] = data.map((item: { id?: string; name?: string; description?: string; long_description?: string; location?: string; price_range?: string; currency?: string; category?: string; categories?: string[]; rating?: number; is_verified?: boolean; image?: string; brand_images?: any[]; video_url?: string; video_thumbnail?: string }) => {
      // Debug: Log the raw currency value from database
      console.log(
        `🔍 Brand ${item.name}: raw currency from DB = '${item.currency}'`
      );

      // Clean location data - remove trailing 'O' and '0' characters that might be data entry errors
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
        // Construct image URL from brand_images relationship
        image: item.brand_images?.[0]?.storage_path
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/${item.brand_images[0].storage_path}`
          : item.image || "/placeholder-image.jpg", // Fallback to old image field for backward compatibility
        video_url: item.video_url || undefined,
        video_thumbnail: item.video_thumbnail || undefined,
        // Include the new normalized images
        brand_images: item.brand_images || [],
      };
    });

    // Update cache
    brandsCache = {
      data: fullBrands,
      timestamp: now,
      isLoading: false,
    };

    console.log(`✅ Successfully fetched ${fullBrands.length} brands`);
    return fullBrands;
  } catch (err) {
    console.error("⛔ Unexpected error in getAllBrands:", err);
    brandsCache.isLoading = false;

    // If this is a known error (thrown by us), rethrow it
    if (err instanceof Error) {
      throw err;
    }

    // Otherwise, wrap it in a new error
    throw new Error(`Failed to fetch brands: ${err}`);
  }
}

// Function to provide sample data in case of database connection issues
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
      // image property removed - use brand_images table instead
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
      // image property removed - use brand_images table instead
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
      // image property removed - use brand_images table instead
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
      // image property removed - use brand_images table instead
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
  brandsCache = {
    data: null,
    timestamp: 0,
    isLoading: false,
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
  return getAllBrands(filterEmptyBrands);
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
  console.log(
    "🔄 Brands and collections cache cleared after brand update"
  );

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
 * Fetch brands by category
 */
export async function getBrandsByCategory(category: string): Promise<Brand[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("brands")
    .select("*, brand_images(*)")
    .eq("category", category);

  if (error) {
    console.error(`Error fetching brands in category ${category}:`, error);
    throw error;
  }

  return data || [];
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
  brandsCache = {
    data: null,
    timestamp: 0,
    isLoading: false,
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
    const brandMap = new Map(data.map((brand: { id: string; name: string }) => [brand.id, brand.name]));

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
