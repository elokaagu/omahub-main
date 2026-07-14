import { supabase } from "@/lib/supabase";

const CUSTOMER_SIGNUP_ENABLED_KEY = "customer_signup_enabled";

/**
 * No row yet = signup is off: OmaHub isn't selling directly through the site
 * yet, so there's no reason to push customers to create accounts until
 * preorders launch with the next edition. Designer/admin sign-in is a
 * separate flow and is never affected by this setting.
 */
export async function getCustomerSignupEnabled(): Promise<boolean> {
  try {
    if (!supabase) return false;

    const { data, error } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", CUSTOMER_SIGNUP_ENABLED_KEY)
      .maybeSingle();

    if (error) throw error;
    return data?.value === "true";
  } catch (error) {
    console.error("Error fetching customer signup setting:", error);
    return false;
  }
}
