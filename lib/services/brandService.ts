import { supabase, Brand, Review, Collection } from "../supabase";

// ENABLE CACHING FOR PRODUCTION
let brandsCache: {
  data: Brand[] | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

// Cache expiration time (15 minutes)
const CACHE_EXPIRY = 15 * 60 * 1000;

// Define essential fields to reduce payload size
const ESSENTIAL_BRAND_FIELDS =
  "id,name,image,category,location,is_verified,rating,description";

// Define category mappings to handle variations
const CATEGORY_MAPPINGS: Record<string, string[]> = {
  Bridal: ["Bridal", "Wedding", "Bridal Wear"],
  "Ready to Wear": ["Ready to Wear", "RTW", "Pret-a-Porter"],
  Tailoring: ["Tailoring", "Formal Wear", "Bespoke"],
  Accessories: ["Accessories", "Jewelry", "Bags"],
  Other: ["Home & Lifestyle", "Other"],
};

/**
 * Fetch all brands from the database
 */
export async function getAllBrands(): Promise<Brand[]> {
  try {
    // Check cache first
    const now = Date.now();
    if (brandsCache.data && now - brandsCache.timestamp < CACHE_EXPIRY) {
      console.log("📦 Using cached brands data");
      return brandsCache.data;
    }

    console.log("🔍 getAllBrands: Starting fetch from database...");

    // Debug Supabase connection
    if (!supabase) {
      console.error("⛔ ERROR: Supabase client is undefined!");
      return [];
    }

    // Use optimized query with only essential fields
    const { data, error } = await supabase
      .from("brands")
      .select(ESSENTIAL_BRAND_FIELDS)
      .order("name", { ascending: true });

    if (error) {
      console.error("⛔ Error fetching brands:", error.message);
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
      id: item.id || `temp-id-${Math.random().toString(36).substring(2, 9)}`,
      name: item.name || "Brand Name",
      description: item.description || "Brand description",
      long_description: "Long brand description",
      location: item.location || "Unknown location",
      price_range: "$$",
      category: item.category || "Other",
      rating: item.rating || 4.5,
      is_verified: item.is_verified || false,
      image: item.image || "/placeholder-image.jpg",
    }));

    // Update cache
    brandsCache = {
      data: fullBrands,
      timestamp: now,
    };

    return fullBrands;
  } catch (err) {
    console.error("⛔ Unexpected error in getAllBrands:", err);
    return [];
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
      price_range: "$$",
      category: "Ready to Wear",
      rating: 4.8,
      is_verified: true,
      image: "/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png",
    },
    {
      id: "sample-brand-2",
      name: "Imad Eduso",
      description: "Luxury bridal wear",
      long_description: "Luxury bridal wear with a modern African twist.",
      location: "Lagos",
      price_range: "$$$",
      category: "Bridal",
      rating: 5.0,
      is_verified: true,
      image: "/lovable-uploads/57cc6a40-0f0d-4a7d-8786-41f15832ebfb.png",
    },
    {
      id: "sample-brand-3",
      name: "Emmy Kasbit",
      description: "Contemporary tailoring",
      long_description:
        "Contemporary tailoring with a focus on quality and detail.",
      location: "Accra",
      price_range: "$$",
      category: "Tailoring",
      rating: 4.6,
      is_verified: true,
      image: "/lovable-uploads/99ca757a-bed8-422e-b155-0b9d365b58e0.png",
    },
    {
      id: "sample-brand-4",
      name: "Shekudo",
      description: "Handcrafted accessories",
      long_description: "Handcrafted accessories made with local materials.",
      location: "Nairobi",
      price_range: "$$",
      category: "Accessories",
      rating: 4.7,
      is_verified: true,
      image: "/lovable-uploads/25c3fe26-3fc4-43ef-83ac-6931a74468c0.png",
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
  try {
    // If category is "All Categories", return all brands
    if (category === "All Categories") {
      return getAllBrands();
    }

    // Find all possible category variations
    const categoryVariations = CATEGORY_MAPPINGS[category] || [category];

    const { data, error } = await supabase
      .from("brands")
      .select(ESSENTIAL_BRAND_FIELDS)
      .in("category", categoryVariations)
      .order("name", { ascending: true });

    if (error) {
      console.error(`Error fetching brands in category ${category}:`, error);
      return [];
    }

    // Map the data to Brand objects
    return (
      data?.map((item) => ({
        id: item.id || `temp-id-${Math.random().toString(36).substring(2, 9)}`,
        name: item.name || "Brand Name",
        description: item.description || "Brand description",
        long_description: "Long brand description",
        location: item.location || "Unknown location",
        price_range: "$$",
        category: item.category || "Other",
        rating: item.rating || 4.5,
        is_verified: item.is_verified || false,
        image: item.image || "/placeholder-image.jpg",
      })) || []
    );
  } catch (error) {
    console.error(`Error in getBrandsByCategory for ${category}:`, error);
    return [];
  }
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
