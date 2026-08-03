import { supabase } from "@/lib/supabase";

export type EditionImageKind =
  | "cover"
  | "gallery"
  | "story"
  | "partner"
  | "video";

export interface EditionImage {
  id: string;
  edition_slug: string;
  image_url: string;
  alt_text: string | null;
  kind: EditionImageKind;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AddEditionImageData {
  edition_slug: string;
  image_url: string;
  alt_text?: string | null;
  kind: EditionImageKind;
  /** Story photos only: which paragraph (0-indexed) the photo follows. */
  position?: number;
}

/** All admin-managed images for one edition, cover first then gallery order. */
export async function getEditionImages(
  editionSlug: string,
): Promise<EditionImage[]> {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("edition_images")
      .select("*")
      .eq("edition_slug", editionSlug)
      .order("kind", { ascending: true })
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching edition images:", error);
    return [];
  }
}

/** Every admin-managed image across all editions, for merging into archive listings. */
export async function getAllEditionImages(): Promise<EditionImage[]> {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("edition_images")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching all edition images:", error);
    return [];
  }
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
    throw new Error("Permission denied: Only super admins can manage edition images");
  }
}

/**
 * Add an edition image (super admin only). A new cover or video replaces
 * any existing one of that kind for that edition, since only one can lead
 * the archive card / detail page hero (cover) or play in the story section
 * (video) at a time. Gallery images are appended. Story photos use an
 * explicit paragraph position instead of appending.
 */
export async function addEditionImage(
  userId: string,
  data: AddEditionImageData,
): Promise<EditionImage> {
  if (!supabase) throw new Error("Supabase client not available");

  await assertSuperAdmin(userId);

  if (data.kind === "cover" || data.kind === "video") {
    const { error: deleteError } = await supabase
      .from("edition_images")
      .delete()
      .eq("edition_slug", data.edition_slug)
      .eq("kind", data.kind);
    if (deleteError) throw deleteError;
  }

  let displayOrder = data.position ?? 0;
  if (data.kind === "gallery" || data.kind === "partner") {
    const { data: existing, error: existingError } = await supabase
      .from("edition_images")
      .select("display_order")
      .eq("edition_slug", data.edition_slug)
      .eq("kind", data.kind)
      .order("display_order", { ascending: false })
      .limit(1);
    if (existingError) throw existingError;
    displayOrder = (existing?.[0]?.display_order ?? -1) + 1;
  }

  const { position, ...insertData } = data;
  const { data: inserted, error } = await supabase
    .from("edition_images")
    .insert({ ...insertData, display_order: displayOrder })
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return inserted;
}

/** Update an edition image's placement or label (super admin only). */
export async function updateEditionImage(
  userId: string,
  id: string,
  data: { position?: number; alt_text?: string | null },
): Promise<EditionImage> {
  if (!supabase) throw new Error("Supabase client not available");

  await assertSuperAdmin(userId);

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.position !== undefined) {
    updates.display_order = data.position;
  }
  if (data.alt_text !== undefined) {
    updates.alt_text = data.alt_text;
  }

  const { data: updated, error } = await supabase
    .from("edition_images")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return updated;
}

/** Delete an edition image (super admin only). */
export async function deleteEditionImage(
  userId: string,
  id: string,
): Promise<void> {
  if (!supabase) throw new Error("Supabase client not available");

  await assertSuperAdmin(userId);

  const { error } = await supabase.from("edition_images").delete().eq("id", id);
  if (error) throw error;
}
