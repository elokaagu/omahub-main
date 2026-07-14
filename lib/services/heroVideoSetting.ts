import { supabase } from "@/lib/supabase";

const HERO_VIDEO_ID_KEY = "hero_video_id";

/** Falls back to the launch film if no override has been set in Studio > Settings. */
export const DEFAULT_HERO_VIDEO_ID = "1206857643";

/** Public read: the Vimeo video ID for the homepage hero, editable in Studio > Settings. */
export async function getHeroVideoId(): Promise<string> {
  try {
    if (!supabase) return DEFAULT_HERO_VIDEO_ID;

    const { data, error } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", HERO_VIDEO_ID_KEY)
      .maybeSingle();

    if (error) throw error;
    const value = data?.value?.trim();
    return value || DEFAULT_HERO_VIDEO_ID;
  } catch (error) {
    console.error("Error fetching hero video id:", error);
    return DEFAULT_HERO_VIDEO_ID;
  }
}
