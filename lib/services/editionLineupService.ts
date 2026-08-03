import { supabase } from "@/lib/supabase";

export interface EditionLineupBrand {
  id: string;
  edition_slug: string;
  brand_id: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AddEditionLineupBrandData {
  edition_slug: string;
  brand_id: string;
}

async function assertSuperAdmin(userId: string): Promise<void> {
  if (!supabase) throw new Error("Supabase client not available");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) throw new Error(`Permission check failed: ${error.message}`);
  if (profile?.role !== "super_admin") {
    throw new Error(
      "Permission denied: Only super admins can manage edition lineups",
    );
  }
}

/** Public read of all edition lineups (for Studio list stats). */
export async function getAllEditionLineupBrands(): Promise<EditionLineupBrand[]> {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("edition_lineup_brands")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching all edition lineups:", error);
    return [];
  }
}

/** Admin-managed brand lineup for one edition, in display order. */
export async function getEditionLineup(
  editionSlug: string,
): Promise<EditionLineupBrand[]> {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("edition_lineup_brands")
      .select("*")
      .eq("edition_slug", editionSlug)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching edition lineup:", error);
    return [];
  }
}

/** Add a brand to an edition lineup (super admin only). Appends to the end. */
export async function addEditionLineupBrand(
  userId: string,
  data: AddEditionLineupBrandData,
): Promise<EditionLineupBrand> {
  if (!supabase) throw new Error("Supabase client not available");

  await assertSuperAdmin(userId);

  const { data: existing, error: existingError } = await supabase
    .from("edition_lineup_brands")
    .select("display_order")
    .eq("edition_slug", data.edition_slug)
    .order("display_order", { ascending: false })
    .limit(1);

  if (existingError) throw existingError;

  const displayOrder = (existing?.[0]?.display_order ?? -1) + 1;

  const { data: inserted, error } = await supabase
    .from("edition_lineup_brands")
    .insert({
      edition_slug: data.edition_slug,
      brand_id: data.brand_id,
      display_order: displayOrder,
    })
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return inserted;
}

/** Remove a brand from an edition lineup (super admin only). */
export async function deleteEditionLineupBrand(
  userId: string,
  id: string,
): Promise<void> {
  if (!supabase) throw new Error("Supabase client not available");

  await assertSuperAdmin(userId);

  const { error } = await supabase
    .from("edition_lineup_brands")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
