import { supabase } from "@/lib/supabase";

export interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  link?: string;
  hero_title?: string;
  is_editorial: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateHeroSlideData {
  image: string;
  title: string;
  subtitle?: string;
  link?: string;
  hero_title?: string;
  is_editorial?: boolean;
  display_order: number;
  is_active?: boolean;
}

export interface UpdateHeroSlideData extends Partial<CreateHeroSlideData> {}

/**
 * Get all active hero slides ordered by display_order
 */
export async function getActiveHeroSlides(): Promise<HeroSlide[]> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    const { data, error } = await supabase
      .from("hero_slides")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(5);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching active hero slides:", error);
    return [];
  }
}

/**
 * Get all hero slides for admin management
 */
export async function getAllHeroSlides(): Promise<HeroSlide[]> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    const { data, error } = await supabase
      .from("hero_slides")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching all hero slides:", error);
    throw error;
  }
}

/**
 * Get hero slide by ID
 */
export async function getHeroSlide(id: string): Promise<HeroSlide | null> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    const { data, error } = await supabase
      .from("hero_slides")
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
    console.error("Error fetching hero slide:", error);
    throw error;
  }
}

/**
 * Create a new hero slide (super admin only)
 */
export async function createHeroSlide(
  userId: string,
  slideData: CreateHeroSlideData
): Promise<HeroSlide> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    const { data, error } = await supabase
      .from("hero_slides")
      .insert({
        ...slideData,
        is_editorial: slideData.is_editorial ?? true,
        is_active: slideData.is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error creating hero slide:", error);
    throw error;
  }
}

/**
 * Update a hero slide (super admin only)
 */
export async function updateHeroSlide(
  userId: string,
  id: string,
  updates: UpdateHeroSlideData
): Promise<HeroSlide> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    const { data, error } = await supabase
      .from("hero_slides")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error updating hero slide:", error);
    throw error;
  }
}

/**
 * Delete a hero slide (super admin only)
 */
export async function deleteHeroSlide(
  userId: string,
  id: string
): Promise<void> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    const { error } = await supabase.from("hero_slides").delete().eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting hero slide:", error);
    throw error;
  }
}

/**
 * Reorder hero slides (super admin only)
 */
export async function reorderHeroSlides(
  userId: string,
  slideIds: string[]
): Promise<void> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    await Promise.all(
      slideIds.map((id, index) =>
        supabase!
          .from("hero_slides")
          .update({ display_order: index + 1 })
          .eq("id", id)
      )
    );
  } catch (error) {
    console.error("Error reordering hero slides:", error);
    throw error;
  }
}

/**
 * Toggle hero slide active status (super admin only)
 */
export async function toggleHeroSlideStatus(
  userId: string,
  id: string,
  isActive: boolean
): Promise<HeroSlide> {
  try {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    const { data, error } = await supabase
      .from("hero_slides")
      .update({ is_active: isActive })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error toggling hero slide status:", error);
    throw error;
  }
}
