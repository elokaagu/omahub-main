import { supabase, Brand, Review, Collection } from "../supabase";

/**
 * Fetch all brands from the database
 */
export async function getAllBrands(): Promise<Brand[]> {
  const { data, error } = await supabase.from("brands").select("*");

  if (error) {
    console.error("Error fetching brands:", error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch a single brand by ID
 */
export async function getBrandById(id: string): Promise<Brand | null> {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching brand ${id}:`, error);
    return null;
  }

  return data;
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
