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
      video_url?: string;
      video_thumbnail?: string;
      brand_images?: any[];
    };
  })[]
> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  console.log("🔄 Fetching fresh tailors data from database");
  const { data, error } = await supabase
    .from("tailors")
    .select(
      `
      *,
      brand:brands(id, name, location, is_verified, category, image, video_url, video_thumbnail, brand_images(*))
    `
    )
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("Error fetching tailors with brands:", error);
    throw error;
  }

  // Process the data to construct proper image URLs from brand_images
  const processedData = (data || []).map(tailor => {
    if (tailor.brand && tailor.brand.brand_images && tailor.brand.brand_images.length > 0) {
      // Use the new brand_images relationship - this ensures we get the current studio images
      const storagePath = tailor.brand.brand_images[0].storage_path;
      tailor.brand.image = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/${storagePath}`;
    }
    // If no brand_images, keep the existing brands.image field as fallback
    return tailor;
  };

  return processedData;
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
