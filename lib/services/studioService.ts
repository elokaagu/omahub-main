import { supabase, Brand } from "../supabase";
import { Collection } from "../data/brands";
import { getProfile, isAdmin as checkIsAdmin } from "./authService";

/**
 * Check if user has admin access
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return checkIsAdmin(userId);
}

/**
 * Create a new brand
 */
export async function createBrand(
  userId: string,
  brandData: Omit<Brand, "id" | "rating">
): Promise<Brand> {
  // Check admin access first
  const hasAccess = await isAdmin(userId);
  if (!hasAccess) {
    throw new Error(
      "Unauthorized: Only admins and super admins can create brands"
    );
  }

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
  userId: string,
  id: string,
  updates: Partial<Omit<Brand, "id" | "rating">>
): Promise<Brand> {
  // Check admin access
  const hasAccess = await isAdmin(userId);
  if (!hasAccess) {
    throw new Error(
      "Unauthorized: Only admins and super admins can update brands"
    );
  }

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
export async function deleteBrand(userId: string, id: string): Promise<void> {
  // Check admin access
  const hasAccess = await isAdmin(userId);
  if (!hasAccess) {
    throw new Error(
      "Unauthorized: Only admins and super admins can delete brands"
    );
  }

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
  userId: string,
  collection: Omit<Collection, "id">
): Promise<Collection> {
  // Check admin access
  const hasAccess = await isAdmin(userId);
  if (!hasAccess) {
    throw new Error("Unauthorized: Only admins can add collections");
  }

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
  userId: string,
  id: string,
  updates: Partial<Omit<Collection, "id">>
): Promise<Collection> {
  // Check admin access
  const hasAccess = await isAdmin(userId);
  if (!hasAccess) {
    throw new Error("Unauthorized: Only admins can update collections");
  }

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
export async function deleteCollection(
  userId: string,
  id: string
): Promise<void> {
  // Check admin access
  const hasAccess = await isAdmin(userId);
  if (!hasAccess) {
    throw new Error("Unauthorized: Only admins can delete collections");
  }

  const { error } = await supabase.from("collections").delete().eq("id", id);

  if (error) {
    console.error(`Error deleting collection ${id}:`, error);
    throw error;
  }
}
