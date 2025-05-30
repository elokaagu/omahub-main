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

/**
 * Get all active hero slides ordered by display_order
 */
export async function getActiveHeroSlides(): Promise<HeroSlide[]> {
  const { data, error } = await supabase
    .from("hero_slides")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .limit(3);

  if (error) {
    console.error("Error fetching hero slides:", error);
    return [];
  }

  return data || [];
}

/**
 * Get all hero slides for admin management
 */
export async function getAllHeroSlides(): Promise<HeroSlide[]> {
  const { data, error } = await supabase
    .from("hero_slides")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching hero slides:", error);
    return [];
  }

  return data || [];
}

/**
 * Create a new hero slide
 */
export async function createHeroSlide(
  slide: Omit<HeroSlide, "id" | "created_at" | "updated_at">
): Promise<HeroSlide | null> {
  const { data, error } = await supabase
    .from("hero_slides")
    .insert([slide])
    .select()
    .single();

  if (error) {
    console.error("Error creating hero slide:", error);
    return null;
  }

  return data;
}

/**
 * Update a hero slide
 */
export async function updateHeroSlide(
  id: string,
  slide: Partial<HeroSlide>
): Promise<HeroSlide | null> {
  const { data, error } = await supabase
    .from("hero_slides")
    .update(slide)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating hero slide:", error);
    return null;
  }

  return data;
}

/**
 * Delete a hero slide
 */
export async function deleteHeroSlide(id: string): Promise<boolean> {
  const { error } = await supabase.from("hero_slides").delete().eq("id", id);

  if (error) {
    console.error("Error deleting hero slide:", error);
    return false;
  }

  return true;
}

/**
 * Reorder hero slides
 */
export async function reorderHeroSlides(slideIds: string[]): Promise<boolean> {
  try {
    await Promise.all(
      slideIds.map((id, index) =>
        supabase
          .from("hero_slides")
          .update({ display_order: index + 1 })
          .eq("id", id)
      )
    );
    return true;
  } catch (error) {
    console.error("Error reordering hero slides:", error);
    return false;
  }
}
