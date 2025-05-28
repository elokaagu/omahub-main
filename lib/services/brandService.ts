import { supabase, Brand, Review, Collection } from "../supabase";

// TEMPORARILY DISABLE ALL CACHING FOR TESTING
let brandsCache: {
  data: Brand[] | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

// Cache expiration time (10 minutes - increased from 5)
const CACHE_EXPIRY = 10 * 60 * 1000;

// Define essential fields to reduce payload size
const ESSENTIAL_BRAND_FIELDS =
  "id,name,image,category,location,is_verified,rating";

/**
 * Fetch all brands from the database
 */
export async function getAllBrands(): Promise<Brand[]> {
  try {
    // Always bypass cache for testing
    console.log("🔍 Fetching brands directly from database...");

    // Debug Supabase connection
    if (!supabase) {
      console.error("⛔ ERROR: Supabase client is undefined!");
      return [];
    }

    // Use simpler query that's less likely to fail
    const { data, error } = await supabase
      .from("brands")
      .select("id, name, image, category, location, is_verified, rating");

    if (error) {
      console.error(
        "⛔ Error fetching brands:",
        error.message,
        error.details,
        error.hint
      );
      return [];
    }

    if (!data || data.length === 0) {
      console.warn("⚠️ No brands found in the database!");
      return [];
    }

    // Debug first few brands
    console.log(`✅ Successfully fetched ${data.length} brands`);
    console.log("📋 First brand sample:", JSON.stringify(data[0], null, 2));

    // ADDITIONAL DIAGNOSIS - Log each brand to check for problematic entries
    console.log("🔍 Checking all brands for potential issues:");
    for (let i = 0; i < data.length; i++) {
      // Skip logging all brands, just log ones with potential problems
      const brand = data[i];
      const issues = [];

      if (!brand.id) issues.push("missing ID");
      if (!brand.name) issues.push("missing name");
      if (!brand.image) issues.push("missing image");
      if (!brand.category) issues.push("missing category");
      if (!brand.location) issues.push("missing location");

      if (issues.length > 0) {
        console.warn(`⚠️ Brand ${i} has issues:`, issues, brand);
      }
    }

    // Create brand objects with all required fields filled
    const fullBrands: Brand[] = data.map((item) => ({
      id: item.id,
      name: item.name,
      description: "Brand description", // Default values for required fields
      long_description: "Long brand description",
      location: item.location || "Unknown location",
      price_range: "$$",
      category: item.category || "Other",
      rating: item.rating || 4.5,
      is_verified: item.is_verified || false,
      image: item.image || "/placeholder-image.jpg",
    }));

    return fullBrands;
  } catch (err) {
    console.error("⛔ Unexpected error in getAllBrands:", err);
    return [];
  }
}

/**
 * Clear the brands cache to force a fresh fetch
 */
export function clearBrandsCache(): void {
  console.log("Clearing brands cache");
  brandsCache = {
    data: null,
    timestamp: 0,
  };
}

/**
 * Fetch a single brand by ID
 */
export async function getBrandById(id: string): Promise<Brand | null> {
  // Normalize the brand ID
  const normalizedId = id
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");

  console.log(
    `Attempting to fetch brand with ID: "${id}" (normalized: "${normalizedId}")`
  );

  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("id", normalizedId)
    .single();

  if (error) {
    console.error(`Error fetching brand ${normalizedId}:`, error);
    return null;
  }

  if (!data) {
    console.log(`No brand found with ID: "${normalizedId}"`);
    return null;
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
  id: string,
  brandData: Partial<Brand>
): Promise<Brand | null> {
  const { data, error } = await supabase
    .from("brands")
    .update(brandData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating brand ${id}:`, error);
    throw error;
  }

  return data;
}

/**
 * Delete a brand
 */
export async function deleteBrand(id: string): Promise<void> {
  const { error } = await supabase.from("brands").delete().eq("id", id);

  if (error) {
    console.error(`Error deleting brand ${id}:`, error);
    throw error;
  }
}

/**
 * Fetch brands by category
 */
export async function getBrandsByCategory(category: string): Promise<Brand[]> {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
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
 * Fetch collections for a brand
 */
export async function getBrandCollections(
  brandId: string
): Promise<Collection[]> {
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("brand_id", brandId);

  if (error) {
    console.error(`Error fetching collections for brand ${brandId}:`, error);
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
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

  if (error) {
    console.error(`Error searching brands with query ${query}:`, error);
    throw error;
  }

  return data || [];
}
