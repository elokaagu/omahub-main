import { supabase } from "../supabase";

export type CollectionImage = {
  id: string;
  collection_id: string;
  image_url: string;
  alt_text?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
};

/**
 * Fetch all images for a specific collection
 */
export async function getCollectionImages(
  collectionId: string
): Promise<CollectionImage[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("catalogue_images")
    .select("*")
    .eq("catalogue_id", collectionId)
    .order("display_order");

  if (error) {
    console.error("Error fetching collection images:", error);
    throw error;
  }

  return data || [];
}

/**
 * Add a new image to a collection
 */
export async function addCollectionImage(
  collectionId: string,
  imageUrl: string,
  altText?: string,
  displayOrder?: number
): Promise<CollectionImage | null> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  // Get the current max display order for this collection
  const { data: existingImages } = await supabase
    .from("catalogue_images")
    .select("display_order")
    .eq("catalogue_id", collectionId)
    .order("display_order", { ascending: false })
    .limit(1);

  const nextOrder =
    displayOrder !== undefined
      ? displayOrder
      : existingImages && existingImages.length > 0
        ? existingImages[0].display_order + 1
        : 1;

  const { data, error } = await supabase
    .from("catalogue_images")
    .insert([
      {
        collection_id: collectionId,
        image_url: imageUrl,
        alt_text: altText,
        display_order: nextOrder,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error adding collection image:", error);
    throw error;
  }

  return data;
}

/**
 * Update a collection image
 */
export async function updateCollectionImage(
  imageId: string,
  updates: Omit<
    CollectionImage,
    "id" | "collection_id" | "created_at" | "updated_at"
  >
): Promise<CollectionImage | null> {
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
    console.error("Error updating collection image:", error);
    throw error;
  }

  return data;
}

/**
 * Delete a collection image
 */
export async function deleteCollectionImage(imageId: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { error } = await supabase
    .from("catalogue_images")
    .delete()
    .eq("id", imageId);

  if (error) {
    console.error("Error deleting collection image:", error);
    throw error;
  }
}

/**
 * Reorder collection images
 */
export async function reorderCollectionImages(
  collectionId: string,
  imageOrders: { id: string; display_order: number }[]
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  // Update each image's display order
  const updatePromises = imageOrders.map(({ id, display_order }: { id: string; display_order: number }) =>
    supabase
      .from("catalogue_images")
      .update({ display_order })
      .eq("id", id)
      .eq("catalogue_id", collectionId)
  );

  const results = await Promise.all(updatePromises);

  // Check for any errors
  const errors = results.filter((result) => result.error);
  if (errors.length > 0) {
    console.error("Error reordering collection images:", errors);
    throw new Error("Failed to reorder some images");
  }
}
