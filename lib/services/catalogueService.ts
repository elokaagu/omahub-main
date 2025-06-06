import { supabase, Catalogue, Brand } from "../supabase";

/**
 * Fetch all catalogues from the database
 */
export async function getAllCatalogues(): Promise<Catalogue[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase.from("catalogues").select("*");

  if (error) {
    console.error("Error fetching catalogues:", error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch a single catalogue by ID
 */
export async function getCatalogueById(id: string): Promise<Catalogue | null> {
  if (!supabase) {
    console.error("Supabase client not available");
    return null;
  }

  const { data, error } = await supabase
    .from("catalogues")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching catalogue ${id}:`, error);
    return null;
  }

  return data;
}

/**
 * Fetch a single catalogue with brand information by ID
 */
export async function getCatalogueWithBrand(id: string): Promise<
  | (Catalogue & {
      brand: Brand;
      created_at?: string;
    })
  | null
> {
  if (!supabase) {
    console.error("Supabase client not available");
    return null;
  }

  const { data, error } = await supabase
    .from("catalogues")
    .select(
      `
      *,
      brand:brands(*)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching catalogue with brand ${id}:`, error);
    return null;
  }

  return data;
}

/**
 * Fetch catalogues with brand information
 */
export async function getCataloguesWithBrands(): Promise<
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
    console.error("Error fetching catalogues with brands:", error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new catalogue
 */
export async function createCatalogue(
  catalogueData: Omit<Catalogue, "id">
): Promise<Catalogue | null> {
  try {
    const response = await fetch("/api/studio/catalogues", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(catalogueData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create catalogue");
    }

    const { catalogue } = await response.json();
    return catalogue;
  } catch (error) {
    console.error("Error creating catalogue:", error);
    throw error;
  }
}

/**
 * Update a catalogue
 */
export async function updateCatalogue(
  id: string,
  catalogueData: Partial<Catalogue>
): Promise<Catalogue | null> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("catalogues")
    .update(catalogueData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating catalogue ${id}:`, error);
    throw error;
  }

  return data;
}

/**
 * Delete a catalogue
 */
export async function deleteCatalogue(id: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { error } = await supabase.from("catalogues").delete().eq("id", id);

  if (error) {
    console.error(`Error deleting catalogue ${id}:`, error);
    throw error;
  }
}
