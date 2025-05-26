import { supabase, Collection } from "../supabase";

/**
 * Fetch all collections from the database
 */
export async function getAllCollections(): Promise<Collection[]> {
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
 * Create a new collection
 */
export async function createCollection(
  collectionData: Omit<Collection, "id">
): Promise<Collection | null> {
  const { data, error } = await supabase
    .from("collections")
    .insert([collectionData])
    .select()
    .single();

  if (error) {
    console.error("Error creating collection:", error);
    throw error;
  }

  return data;
}

/**
 * Update a collection
 */
export async function updateCollection(
  id: string,
  collectionData: Partial<Collection>
): Promise<Collection | null> {
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
  const { error } = await supabase.from("collections").delete().eq("id", id);

  if (error) {
    console.error(`Error deleting collection ${id}:`, error);
    throw error;
  }
}
