import { supabase, Catalogue, Brand } from "../supabase";

/**
 * Fetch all collections from the database
 */
export async function getAllCollections(): Promise<Catalogue[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase.from("catalogues").select("*");

  if (error) {
    console.error("Error fetching collections:", error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch a single collection by ID
 */
export async function getCollectionById(id: string): Promise<Catalogue | null> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("catalogues")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching collection ${id}:`, error);
    throw error;
  }

  return data;
}

/**
 * Fetch a single collection with brand information by ID
 */
export async function getCollectionWithBrand(id: string): Promise<
  | (Catalogue & {
      brand: {
        name: string;
        id: string;
        location: string;
        is_verified: boolean;
        category: string;
      };
    })
  | null
> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("catalogues")
    .select(
      `
      *,
      brand:brands(id, name, location, is_verified, category)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching collection with brand ${id}:`, error);
    throw error;
  }

  return data;
}

/**
 * Fetch collections with brand information
 */
export async function getCollectionsWithBrands(): Promise<
  (Catalogue & {
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

  const { data, error } = await supabase.from("catalogues").select(`
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
  collectionData: Omit<Catalogue, "id">
): Promise<Catalogue | null> {
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
  collectionData: Partial<Catalogue>
): Promise<Catalogue | null> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("catalogues")
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

  const { error } = await supabase.from("catalogues").delete().eq("id", id);

  if (error) {
    console.error(`Error deleting collection ${id}:`, error);
    throw error;
  }
}
