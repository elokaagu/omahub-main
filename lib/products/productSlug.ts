import type { SupabaseClient } from "@supabase/supabase-js";

/** Match collections route / studio slug rules: lowercase, hyphen-separated. */
export function slugifyProductTitle(title: string): string {
  const s = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return s || "product";
}

/**
 * Reserve a slug that does not exist on `products.slug` yet.
 * Appends a short random suffix when `base` is already taken.
 */
export async function allocateUniqueProductSlug(
  supabase: SupabaseClient,
  desiredBase: string,
  maxAttempts = 40
): Promise<string> {
  let base = slugifyProductTitle(desiredBase);
  if (base.length > 180) {
    base = base.slice(0, 180).replace(/-+$/, "") || "product";
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate =
      attempt === 0
        ? base
        : `${base}-${Math.random().toString(36).slice(2, 10)}`;

    const { data, error } = await supabase
      .from("products")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (!data) {
      return candidate;
    }
  }

  throw new Error("Could not allocate a unique product slug");
}
