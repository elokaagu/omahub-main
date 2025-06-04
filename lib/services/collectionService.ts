import { supabase, Collection } from "../supabase";

/**
 * Fetch all collections from the database
 */
export async function getAllCollections(): Promise<Collection[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase.from("collections").select("*");

  if (error) {
    console.error("Error fetching collections:", error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch a single collection by ID
 */
export async function getCollectionById(
  id: string
): Promise<Collection | null> {
  if (!supabase) {
    console.error("Supabase client not available");
    return null;
  }

  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching collection ${id}:`, error);
    return null;
  }

  return data;
}

/**
 * Fetch collections with brand information
 */
export async function getCollectionsWithBrands(): Promise<
  (Collection & {
    brand: {
      name: string;
      id: string;
      location: string;
      is_verified: boolean;
      category: string;
    };
  })[]
> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase.from("collections").select(`
      *,
      brand:brands(id, name, location, is_verified, category)
    `);

  if (error) {
    console.error("Error fetching collections with brands:", error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new collection
 */
export async function createCollection(
  collectionData: Omit<Collection, "id">
): Promise<Collection | null> {
  try {
    const response = await fetch("/api/studio/collections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(collectionData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create collection");
    }

    const { collection } = await response.json();
    return collection;
  } catch (error) {
    console.error("Error creating collection:", error);
    throw error;
  }
}

/**
 * Update a collection
 */
export async function updateCollection(
  id: string,
  collectionData: Partial<Collection>
): Promise<Collection | null> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("collections")
    .update(collectionData)
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
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { error } = await supabase.from("collections").delete().eq("id", id);

  if (error) {
    console.error(`Error deleting collection ${id}:`, error);
    throw error;
  }
}
