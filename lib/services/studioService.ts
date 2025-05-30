import { supabase, Brand, Collection } from "../supabase";

/**
 * Create a new brand
 */
export async function createBrand(
  brandData: Omit<Brand, "id" | "rating">
): Promise<Brand> {
  // Generate a URL-friendly slug from the brand name
  const id = brandData.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const { data, error } = await supabase
    .from("brands")
    .insert({
      ...brandData,
      id,
      rating: 0, // Default rating for new brands
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating brand:", error);
    throw error;
  }

  return data;
}

/**
 * Update an existing brand
 */
export async function updateBrand(
  id: string,
  updates: Partial<Omit<Brand, "id" | "rating">>
): Promise<Brand> {
  const { data, error } = await supabase
    .from("brands")
    .update(updates)
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
 * Add a collection to a brand
 */
export async function addCollection(
  collection: Omit<Collection, "id">
): Promise<Collection> {
  const { data, error } = await supabase
    .from("collections")
    .insert(collection)
    .select()
    .single();

  if (error) {
    console.error("Error adding collection:", error);
    throw error;
  }

  return data;
}

/**
 * Update a collection
 */
export async function updateCollection(
  id: string,
  updates: Partial<Omit<Collection, "id">>
): Promise<Collection> {
  const { data, error } = await supabase
    .from("collections")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating collection ${id}:`, error);
    throw error;
  }

  return data;
}

/**
 * Delete a collection
 */
export async function deleteCollection(id: string): Promise<void> {
  const { error } = await supabase.from("collections").delete().eq("id", id);

  if (error) {
    console.error(`Error deleting collection ${id}:`, error);
    throw error;
  }
}

/**
 * Check if user has admin access
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error checking admin status:", error);
    return false;
  }

  return data?.role === "admin";
}
