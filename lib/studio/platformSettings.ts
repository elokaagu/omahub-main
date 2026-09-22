import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PLATFORM_VISIBILITY_EFFECTIVE_WHEN_MISSING,
  PLATFORM_VISIBILITY_KEY,
} from "@/lib/services/platformVisibilityControl";

const SETTING_KEYS = [
  "about_omahub",
  "our_story",
  "tailored_services",
  "hero_video_id",
  "welcome_video_id",
  "hero_media_url",
  "customer_signup_enabled",
  "catalogues_publicly_visible",
] as const;

const MAP_DB_TO_API: Record<
  (typeof SETTING_KEYS)[number],
  | "about"
  | "ourStory"
  | "tailoredServices"
  | "heroVideoId"
  | "welcomeVideoId"
  | "heroMediaUrl"
  | "customerSignupEnabled"
  | "cataloguesPubliclyVisible"
> = {
  about_omahub: "about",
  our_story: "ourStory",
  tailored_services: "tailoredServices",
  hero_video_id: "heroVideoId",
  welcome_video_id: "welcomeVideoId",
  hero_media_url: "heroMediaUrl",
  customer_signup_enabled: "customerSignupEnabled",
  catalogues_publicly_visible: "cataloguesPubliclyVisible",
};

/**
 * No row yet = customer signup is off: OmaHub isn't selling directly through
 * the site yet, so there's no reason to push customers to create accounts
 * until preorders launch with the next edition.
 */
const DEFAULT_CUSTOMER_SIGNUP_ENABLED = "false";
const DEFAULT_CATALOGUES_PUBLICLY_VISIBLE = "false";

export type PlatformSettings = Record<
  (typeof MAP_DB_TO_API)[keyof typeof MAP_DB_TO_API],
  string
>;

/** Public platform settings with defaults filled in. Throws on DB error. */
export async function readPlatformSettings(
  supabase: SupabaseClient,
): Promise<PlatformSettings> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("key, value")
    .in("key", [...SETTING_KEYS]);

  if (error) {
    throw new Error(`platform_settings_get_failed: ${error.message}`);
  }

  const settings: PlatformSettings = {
    about: "",
    ourStory: "",
    tailoredServices: "",
    heroVideoId: "",
    welcomeVideoId: "",
    heroMediaUrl: "",
    customerSignupEnabled: DEFAULT_CUSTOMER_SIGNUP_ENABLED,
    cataloguesPubliclyVisible: DEFAULT_CATALOGUES_PUBLICLY_VISIBLE,
  };

  for (const row of data ?? []) {
    const apiKey = MAP_DB_TO_API[row.key as (typeof SETTING_KEYS)[number]];
    if (!apiKey) continue;
    settings[apiKey] = typeof row.value === "string" ? row.value : "";
  }

  return settings;
}

export type PlatformVisibility = {
  isPublic: boolean;
  status: "public" | "private";
  settingPresent: boolean;
  storedValue: string | null;
  fallback?:
    | "missing_row_defaults_to_private"
    | "unrecognised_stored_value_treated_as_private";
};

/**
 * Current platform_visibility. Only an explicit "public" is public; a
 * missing row or any other value is treated as private. Throws on DB error.
 */
export async function readPlatformVisibility(
  supabase: SupabaseClient,
): Promise<PlatformVisibility> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", PLATFORM_VISIBILITY_KEY)
    .maybeSingle();

  if (error) {
    console.error(
      JSON.stringify({
        event: "platform_status_read_failed",
        code: error.code,
        message: error.message,
      }),
    );
    throw new Error("Failed to read platform status");
  }

  const settingPresent = data != null;
  const storedValue = typeof data?.value === "string" ? data.value : null;
  const isPublic = storedValue === "public";

  const visibility: PlatformVisibility = {
    isPublic,
    status: isPublic ? "public" : "private",
    settingPresent,
    storedValue,
  };
  if (!settingPresent) {
    visibility.fallback = "missing_row_defaults_to_private";
  } else if (storedValue !== "public" && storedValue !== "private") {
    visibility.fallback = "unrecognised_stored_value_treated_as_private";
  }
  return visibility;
}

export { PLATFORM_VISIBILITY_EFFECTIVE_WHEN_MISSING };
