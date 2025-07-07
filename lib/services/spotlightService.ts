import { supabase } from "@/lib/supabase";

export interface SpotlightContent {
  id: string;
  title: string;
  subtitle: string;
  brand_name: string;
  brand_description: string;
  brand_quote: string;
  brand_quote_author: string;
  main_image: string;
  video_url?: string;
  video_thumbnail?: string;
  video_type?:
    | "brand_campaign"
    | "behind_scenes"
    | "interview"
    | "product_demo";
  video_description?: string;
  featured_products: FeaturedProduct[];
  brand_link: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeaturedProduct {
  name: string;
  collection: string;
  image: string;
}

export interface CreateSpotlightData {
  title: string;
  subtitle: string;
  brand_name: string;
  brand_description: string;
  brand_quote: string;
  brand_quote_author: string;
  main_image: string;
  video_url?: string;
  video_thumbnail?: string;
  video_type?:
    | "brand_campaign"
    | "behind_scenes"
    | "interview"
    | "product_demo";
  video_description?: string;
  featured_products: FeaturedProduct[];
  brand_link: string;
  is_active?: boolean;
}

export interface UpdateSpotlightData extends Partial<CreateSpotlightData> {}

/**
 * Get the active spotlight content for the homepage
 */
export async function getActiveSpotlightContent(): Promise<SpotlightContent | null> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    const { data, error } = await supabase
      .from("spotlight_content")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error fetching active spotlight content:", error);
    return null;
  }
}

/**
 * Get all spotlight content (for admin management)
 */
export async function getAllSpotlightContent(): Promise<SpotlightContent[]> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    const { data, error } = await supabase
      .from("spotlight_content")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching all spotlight content:", error);
    throw error;
  }
}

/**
 * Get spotlight content by ID
 */
export async function getSpotlightContent(
  id: string
): Promise<SpotlightContent | null> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    const { data, error } = await supabase
      .from("spotlight_content")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error fetching spotlight content:", error);
    throw error;
  }
}

/**
 * Create new spotlight content (super admin only)
 */
export async function createSpotlightContent(
  userId: string,
  spotlightData: CreateSpotlightData
): Promise<SpotlightContent> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    // If setting this as active, deactivate all others first
    if (spotlightData.is_active !== false) {
      await deactivateAllSpotlightContent();
    }

    const { data, error } = await supabase
      .from("spotlight_content")
      .insert({
        ...spotlightData,
        is_active: spotlightData.is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error creating spotlight content:", error);
    throw error;
  }
}

/**
 * Update spotlight content (super admin only)
 */
export async function updateSpotlightContent(
  userId: string,
  id: string,
  updates: UpdateSpotlightData
): Promise<SpotlightContent> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    // If setting this as active, deactivate all others first
    if (updates.is_active === true) {
      await deactivateAllSpotlightContent();
    }

    const { data, error } = await supabase
      .from("spotlight_content")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error updating spotlight content:", error);
    throw error;
  }
}

/**
 * Delete spotlight content (super admin only)
 */
export async function deleteSpotlightContent(
  userId: string,
  id: string
): Promise<void> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    const { error } = await supabase
      .from("spotlight_content")
      .delete()
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting spotlight content:", error);
    throw error;
  }
}

/**
 * Set a spotlight content as active (deactivates all others)
 */
export async function setActiveSpotlightContent(
  userId: string,
  id: string
): Promise<SpotlightContent> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    // First deactivate all spotlight content
    await deactivateAllSpotlightContent();

    // Then activate the selected one
    const { data, error } = await supabase
      .from("spotlight_content")
      .update({ is_active: true })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error setting active spotlight content:", error);
    throw error;
  }
}

/**
 * Deactivate all spotlight content
 */
async function deactivateAllSpotlightContent(): Promise<void> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    const { error } = await supabase
      .from("spotlight_content")
      .update({ is_active: false })
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Update all rows

    if (error) throw error;
  } catch (error) {
    console.error("Error deactivating spotlight content:", error);
    throw error;
  }
}
