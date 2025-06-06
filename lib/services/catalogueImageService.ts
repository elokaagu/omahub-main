import { supabase } from "../supabase";

export type CatalogueImage = {
  id: string;
  catalogue_id: string;
  image_url: string;
  alt_text?: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
};

/**
 * Fetch all images for a specific catalogue
 */
export async function getCatalogueImages(
  catalogueId: string
): Promise<CatalogueImage[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("catalogue_images")
    .select("*")
    .eq("catalogue_id", catalogueId)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching catalogue images:", error);
    throw error;
  }

  return data || [];
}

/**
 * Add a new image to a catalogue
 */
export async function addCatalogueImage(
  catalogueId: string,
  imageUrl: string,
  altText?: string,
  displayOrder?: number
): Promise<CatalogueImage | null> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  // If no display order provided, get the next available order
  if (displayOrder === undefined) {
    const { data: existingImages } = await supabase
      .from("catalogue_images")
      .select("display_order")
      .eq("catalogue_id", catalogueId)
      .order("display_order", { ascending: false })
      .limit(1);

    displayOrder =
      existingImages && existingImages.length > 0
        ? existingImages[0].display_order + 1
        : 0;
  }

  const { data, error } = await supabase
    .from("catalogue_images")
    .insert({
      catalogue_id: catalogueId,
      image_url: imageUrl,
      alt_text: altText,
      display_order: displayOrder,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding catalogue image:", error);
    throw error;
  }

  return data;
}

/**
 * Update a catalogue image
 */
export async function updateCatalogueImage(
  imageId: string,
  updates: Partial<
    Omit<CatalogueImage, "id" | "catalogue_id" | "created_at" | "updated_at">
  >
): Promise<CatalogueImage | null> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("catalogue_images")
    .update(updates)
    .eq("id", imageId)
    .select()
    .single();

  if (error) {
    console.error("Error updating catalogue image:", error);
    throw error;
  }

  return data;
}

/**
 * Delete a catalogue image
 */
export async function deleteCatalogueImage(imageId: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { error } = await supabase
    .from("catalogue_images")
    .delete()
    .eq("id", imageId);

  if (error) {
    console.error("Error deleting catalogue image:", error);
    throw error;
  }
}

/**
 * Reorder catalogue images
 */
export async function reorderCatalogueImages(
  catalogueId: string,
  imageOrders: { id: string; display_order: number }[]
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  // Update each image's display order
  const updates = imageOrders.map(({ id, display_order }) =>
    supabase
      .from("catalogue_images")
      .update({ display_order })
      .eq("id", id)
      .eq("catalogue_id", catalogueId)
  );

  const results = await Promise.all(updates);

  // Check for any errors
  const errors = results.filter((result) => result.error);
  if (errors.length > 0) {
    console.error("Error reordering catalogue images:", errors);
    throw new Error("Failed to reorder some catalogue images");
  }
}
