import { supabase } from "@/lib/supabase";

export const CATALOGUES_PUBLICLY_VISIBLE_KEY = "catalogues_publicly_visible";

/**
 * No row yet = catalogues/products are hidden on the public site. Brand
 * profiles stay visible; turn this on from Studio > Settings when the next
 * pop-up or edition launches and you want shoppers to browse catalogues.
 */
export async function getCataloguesPubliclyVisible(): Promise<boolean> {
  try {
    if (!supabase) return false;

    const { data, error } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", CATALOGUES_PUBLICLY_VISIBLE_KEY)
      .maybeSingle();

    if (error) throw error;
    return data?.value === "true";
  } catch (error) {
    console.error("Error fetching catalogue visibility setting:", error);
    return false;
  }
}
