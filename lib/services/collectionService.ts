import { supabase, Catalogue, Brand } from "../supabase";

// Cache for collections data
let collectionsCache: {
  data: any[] | null;
  timestamp: number;
} | null = null;

const COLLECTIONS_CACHE_EXPIRY = 10 * 1000; // 10 seconds for fresh data

/**
 * Clear the collections cache
 */
export function clearCollectionsCache(): void {
  collectionsCache = null;
}

/**
 * Fetch all collections from the database
 */
export async function getAllCollections(): Promise<Catalogue[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("catalogues")
    .select("*")
    .order("created_at", { ascending: false }); // Newest first

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
        rating: number;
        long_description: string;
        price_range?: string;
        currency?: string;
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
      brand:brands(id, name, location, is_verified, category, rating, long_description, price_range, currency)
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
export async function getCollectionsWithBrands(forceRefresh: boolean = false): Promise<
  (Catalogue & {
    brand: {
      name: string;
      id: string;
      location: string;
      is_verified: boolean;
      category: string;
      rating: number;
      long_description: string;
      price_range?: string;
    };
  })[]
> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  // Check cache first (unless force refresh is requested)
  if (!forceRefresh && collectionsCache && collectionsCache.data) {
    const now = Date.now();
    if (now - collectionsCache.timestamp < COLLECTIONS_CACHE_EXPIRY) {
      console.log("📦 Using cached collections data");
      return collectionsCache.data;
    }
  }

  console.log("🔄 Fetching fresh collections data from database");
  const { data, error } = await supabase
    .from("catalogues")
    .select(
      `
      *,
      brand:brands(id, name, location, is_verified, category, rating, long_description, price_range)
    `
    )
    .order("created_at", { ascending: false }); // Newest first

  if (error) {
    console.error("Error fetching collections with brands:", error);
    throw error;
  }

  // Update cache
  collectionsCache = {
    data: data || [],
    timestamp: Date.now(),
  };

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
