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
    console.log("🚀 Starting hero slide creation...");
    console.log("User ID:", userId);
    console.log("Slide data:", slideData);

    if (!supabase) {
      console.error("❌ Supabase client not available");
      throw new Error("Supabase client not available");
    }

    console.log("✅ Supabase client available");

    // Verify current session first
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("❌ Session error:", sessionError);
      throw new Error(`Authentication error: ${sessionError.message}`);
    }

    if (!session || session.user.id !== userId) {
      console.error("❌ No valid session or user ID mismatch");
      throw new Error("Authentication required. Please sign in again.");
    }

    console.log("✅ Valid session confirmed");

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Operation timed out after 30 seconds")),
        30000
      );
    });

    // Check if user has permission with timeout
    const permissionCheck = async () => {
      if (!supabase) {
        throw new Error("Supabase client not available");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("❌ Error fetching user profile:", profileError);
        throw new Error(`Permission check failed: ${profileError.message}`);
      }

      console.log("👤 User profile:", profile);

      if (profile?.role !== "super_admin") {
        console.error("❌ User is not super admin:", profile?.role);
        throw new Error(
          "Permission denied: Only super admins can create hero slides"
        );
      }

      console.log("✅ User has super admin permissions");
      return profile;
    };

    // Wait for permission check with timeout
    await Promise.race([permissionCheck(), timeoutPromise]);

    // Prepare the data for insertion
    const insertData = {
      ...slideData,
      is_editorial: slideData.is_editorial ?? true,
      is_active: slideData.is_active ?? true,
    };

    console.log("📝 Insert data:", insertData);

    // Perform the insert with timeout
    const insertOperation = async () => {
      if (!supabase) {
        throw new Error("Supabase client not available");
      }

      const { data, error } = await supabase
        .from("hero_slides")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("❌ Database insert error:", error);
        console.error("Error code:", error.code);
        console.error("Error details:", error.details);
        console.error("Error hint:", error.hint);

        // Handle specific RLS errors
        if (error.code === "42501" || error.message.includes("permission")) {
          throw new Error(
            "Permission denied by database security policies. Please ensure you have the correct admin role."
          );
        }

        throw new Error(`Database error: ${error.message}`);
      }

      return data;
    };

    const data = await Promise.race([insertOperation(), timeoutPromise]);

    console.log("✅ Hero slide created successfully:", data);
    return data;
  } catch (error) {
    console.error("❌ Error creating hero slide:", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        throw new Error(
          "Request timed out. Please check your connection and try again."
        );
      } else if (
        error.message.includes("permission") ||
        error.message.includes("Authentication")
      ) {
        throw new Error(
          "Permission denied. Please ensure you have admin privileges and are properly signed in."
        );
      } else if (error.message.includes("network")) {
        throw new Error(
          "Network error. Please check your internet connection."
        );
      }
    }

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
