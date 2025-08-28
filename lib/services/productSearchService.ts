import { supabase, Product } from "../supabase";

/**
 * Search products by categories
 * This allows finding products that match specific category tags
 */
export async function searchProductsByCategories(
  categories: string[]
): Promise<Product[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  if (!categories || categories.length === 0) {
    return [];
  }

  try {
    // Use the database function for efficient category search
    const { data, error } = await supabase.rpc(
      "search_products_by_categories",
      { search_categories: categories }
    );

    if (error) {
      console.error("Error searching products by categories:", error);
      // Fallback to manual search if function doesn't exist
      return await fallbackCategorySearch(categories);
    }

    return data || [];
  } catch (error) {
    console.error("Error in searchProductsByCategories:", error);
    // Fallback to manual search
    return await fallbackCategorySearch(categories);
  }
}

/**
 * Fallback search method if the database function doesn't exist
 */
async function fallbackCategorySearch(categories: string[]): Promise<Product[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  try {
    // Build the query to search in both category and categories fields
    let query = supabase
      .from("products")
      .select("*")
      .or(`category.in.(${categories.join(",")}),categories.cs.{${categories.join(",")}}`)
      .order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Fallback category search error:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Fallback search failed:", error);
    throw error;
  }
}

/**
 * Get products that match any of the given categories
 * This is useful for homepage filtering
 */
export async function getProductsByCategories(
  categories: string[]
): Promise<Product[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  try {
    // First try to use the optimized function
    const { data, error } = await supabase.rpc(
      "search_products_by_categories",
      { search_categories: categories }
    );

    if (error) {
      // If function doesn't exist, use manual search
      return await fallbackCategorySearch(categories);
    }

    return data || [];
  } catch (error) {
    console.error("Error getting products by categories:", error);
    return await fallbackCategorySearch(categories);
  }
}

/**
 * Get all unique product categories
 * This helps with building category filters
 */
export async function getAllProductCategories(): Promise<string[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  try {
    // Get categories from both the legacy category field and new categories array
    const { data: legacyCategories, error: legacyError } = await supabase
      .from("products")
      .select("category")
      .not("category", "is", null);

    const { data: arrayCategories, error: arrayError } = await supabase
      .from("products")
      .select("categories")
      .not("categories", "is", null);

    if (legacyError || arrayError) {
      console.error("Error fetching product categories:", { legacyError, arrayError });
      return [];
    }

    // Combine and deduplicate categories
    const allCategories = new Set<string>();

    // Add legacy categories
    legacyCategories?.forEach((item: { category: string }) => {
      if (item.category) allCategories.add(item.category);
    });

    // Add array categories
    arrayCategories?.forEach((item: { categories?: string[] }) => {
      if (item.categories && Array.isArray(item.categories)) {
        item.categories.forEach((cat: string) => {
          if (cat) allCategories.add(cat);
        });
      }
    });

    return Array.from(allCategories).sort();
  } catch (error) {
    console.error("Error getting all product categories:", error);
    return [];
  }
}

/**
 * Search products by text and categories
 * Combines text search with category filtering
 */
export async function searchProductsByTextAndCategories(
  searchText: string,
  categories: string[] = []
): Promise<Product[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  try {
    let query = supabase
      .from("products")
      .select("*")
      .or(`title.ilike.%${searchText}%,description.ilike.%${searchText}%`);

    // Add category filtering if categories are specified
    if (categories && categories.length > 0) {
      query = query.or(`category.in.(${categories.join(",")}),categories.cs.{${categories.join(",")}}`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error searching products by text and categories:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in searchProductsByTextAndCategories:", error);
    throw error;
  }
}
