import { supabase } from "@/lib/supabase";

export interface CollectionImage {
  id: string;
  collection_id: string;
  image_url: string;
  alt_text?: string;
  display_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCollectionImageData {
  collection_id: string;
  image_url: string;
  alt_text?: string;
  display_order?: number;
  is_featured?: boolean;
}

export interface UpdateCollectionImageData {
  image_url?: string;
  alt_text?: string;
  display_order?: number;
  is_featured?: boolean;
}

// Get all images for a collection
export async function getCollectionImages(
  collectionId: string
): Promise<CollectionImage[]> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    const { data, error } = await supabase
      .from("collection_images")
      .select("*")
      .eq("collection_id", collectionId)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching collection images:", error);
      throw new Error(`Failed to fetch collection images: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error("Error in getCollectionImages:", error);
    throw error;
  }
}

// Add a new image to a collection
export async function addCollectionImage(
  userId: string,
  imageData: CreateCollectionImageData
): Promise<CollectionImage> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // If no display_order provided, get the next order number
    if (imageData.display_order === undefined) {
      const { data: existingImages } = await supabase
        .from("collection_images")
        .select("display_order")
        .eq("collection_id", imageData.collection_id)
        .order("display_order", { ascending: false })
        .limit(1);

      imageData.display_order =
        existingImages && existingImages.length > 0
          ? existingImages[0].display_order + 1
          : 0;
    }

    const { data, error } = await supabase
      .from("collection_images")
      .insert([imageData])
      .select()
      .single();

    if (error) {
      console.error("Error adding collection image:", error);
      throw new Error(`Failed to add collection image: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error in addCollectionImage:", error);
    throw error;
  }
}

// Update a collection image
export async function updateCollectionImage(
  userId: string,
  imageId: string,
  updateData: UpdateCollectionImageData
): Promise<CollectionImage> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    const { data, error } = await supabase
      .from("collection_images")
      .update(updateData)
      .eq("id", imageId)
      .select()
      .single();

    if (error) {
      console.error("Error updating collection image:", error);
      throw new Error(`Failed to update collection image: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error in updateCollectionImage:", error);
    throw error;
  }
}

// Delete a collection image
export async function deleteCollectionImage(
  userId: string,
  imageId: string
): Promise<void> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    const { error } = await supabase
      .from("collection_images")
      .delete()
      .eq("id", imageId);

    if (error) {
      console.error("Error deleting collection image:", error);
      throw new Error(`Failed to delete collection image: ${error.message}`);
    }
  } catch (error) {
    console.error("Error in deleteCollectionImage:", error);
    throw error;
  }
}

// Reorder collection images
export async function reorderCollectionImages(
  userId: string,
  collectionId: string,
  imageIds: string[]
): Promise<void> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Update display_order for each image
    const updates = imageIds.map((imageId, index) => {
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }
      return supabase
        .from("collection_images")
        .update({ display_order: index })
        .eq("id", imageId)
        .eq("collection_id", collectionId);
    });

    const results = await Promise.all(updates);

    // Check for any errors
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      console.error("Error reordering collection images:", errors);
      throw new Error("Failed to reorder collection images");
    }
  } catch (error) {
    console.error("Error in reorderCollectionImages:", error);
    throw error;
  }
}

// Set featured image
export async function setFeaturedImage(
  userId: string,
  collectionId: string,
  imageId: string
): Promise<void> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // First, unset all featured images for this collection
    await supabase
      .from("collection_images")
      .update({ is_featured: false })
      .eq("collection_id", collectionId);

    // Then set the specified image as featured
    const { error } = await supabase
      .from("collection_images")
      .update({ is_featured: true })
      .eq("id", imageId)
      .eq("collection_id", collectionId);

    if (error) {
      console.error("Error setting featured image:", error);
      throw new Error(`Failed to set featured image: ${error.message}`);
    }
  } catch (error) {
    console.error("Error in setFeaturedImage:", error);
    throw error;
  }
}
