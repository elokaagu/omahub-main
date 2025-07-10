import { supabase, Tailor, Brand } from "../supabase";

/**
 * Fetch all tailors from the database
 */
export async function getAllTailors(): Promise<Tailor[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase.from("tailors").select("*");

  if (error) {
    console.error("Error fetching tailors:", error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch a single tailor by ID
 */
export async function getTailorById(id: string): Promise<Tailor | null> {
  if (!supabase) {
    console.error("Supabase client not available");
    return null;
  }

  const { data, error } = await supabase
    .from("tailors")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching tailor ${id}:`, error);
    return null;
  }

  return data;
}

/**
 * Fetch a single tailor with brand information by ID
 */
export async function getTailorWithBrand(id: string): Promise<
  | (Tailor & {
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
    .from("tailors")
    .select(
      `
      *,
      brand:brands(*)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching tailor with brand ${id}:`, error);
    return null;
  }

  return data;
}

/**
 * Fetch tailors with brand information
 */
export async function getTailorsWithBrands(): Promise<
  (Tailor & {
    brand: {
      name: string;
      id: string;
      location: string;
      is_verified: boolean;
      category: string;
      image: string;
    };
  })[]
> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase.from("tailors").select(`
      *,
      brand:brands(id, name, location, is_verified, category, image)
    `);

  if (error) {
    console.error("Error fetching tailors with brands:", error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new tailor
 */
export async function createTailor(
  tailorData: Omit<Tailor, "id">
): Promise<Tailor | null> {
  try {
    const response = await fetch("/api/studio/tailors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tailorData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create tailor");
    }

    const { tailor } = await response.json();
    return tailor;
  } catch (error) {
    console.error("Error creating tailor:", error);
    throw error;
  }
}

/**
 * Update a tailor
 */
export async function updateTailor(
  id: string,
  tailorData: Partial<Tailor>
): Promise<Tailor | null> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("tailors")
    .update(tailorData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating tailor ${id}:`, error);
    throw error;
  }

  return data;
}

/**
 * Delete a tailor
 */
export async function deleteTailor(id: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { error } = await supabase.from("tailors").delete().eq("id", id);

  if (error) {
    console.error(`Error deleting tailor ${id}:`, error);
    throw error;
  }
}
