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
 * Find active spotlight video for a brand by name (case-insensitive).
 * Fetches at most 40 recent active rows with video, then matches in memory.
 */
export async function getSpotlightVideoForBrandName(
  brandName: string
): Promise<{ url: string; thumbnail?: string } | null> {
  const trimmed = brandName.trim();
  if (!trimmed || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("spotlight_content")
      .select("video_url, video_thumbnail, brand_name")
      .eq("is_active", true)
      .not("video_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(40);

    if (error) {
      console.error("getSpotlightVideoForBrandName:", error.message);
      return null;
    }

    const lower = trimmed.toLowerCase();
    const row = (data ?? []).find(
      (s) => s.brand_name?.toLowerCase() === lower && s.video_url
    );

    if (!row?.video_url) return null;

    return {
      url: row.video_url,
      thumbnail: row.video_thumbnail ?? undefined,
    };
  } catch (e) {
    console.error("getSpotlightVideoForBrandName:", e);
    return null;
  }
}

/** Get spotlight content by ID (e.g. studio editor). */
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

    console.log("🔄 Updating spotlight content in service...", {
      userId,
      id,
      updates: {
        ...updates,
        featured_products: updates.featured_products?.length || 0,
      },
    });

    // Check if user has permission
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("❌ Error fetching user profile:", profileError);
      throw new Error(`Permission check failed: ${profileError.message}`);
    }

    if (profile?.role !== "super_admin") {
      console.error("❌ User is not super admin:", profile?.role);
      throw new Error(
        "Permission denied: Only super admins can update spotlight content"
      );
    }

    // If setting this as active, deactivate all others first
    if (updates.is_active === true) {
      console.log("🔄 Deactivating other spotlight content...");
      await deactivateAllSpotlightContent();
    }

    console.log("🔄 Performing database update...");
    const { data, error } = await supabase
      .from("spotlight_content")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Database update error:", error);
      if (error.code === "42501") {
        throw new Error(
          "Database permission denied. Please check your user role and policies."
        );
      } else if (error.code === "23505") {
        throw new Error("Duplicate entry. Please check your data.");
      } else if (error.code === "23503") {
        throw new Error(
          "Referenced data not found. Please check your relationships."
        );
      } else {
        throw new Error(`Database error: ${error.message}`);
      }
    }

    console.log("✅ Spotlight content updated successfully");
    return data;
  } catch (error: any) {
    console.error("❌ Error updating spotlight content:", error);
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
