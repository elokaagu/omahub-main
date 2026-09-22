import "server-only";
import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase-unified";
import type { Database } from "@/lib/types/supabase";

export type StudioProfile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * The signed-in user and their profile for one Studio request.
 * Wrapped in React `cache`, so the layout and the page share a single
 * auth check + profile lookup per render instead of repeating them.
 */
export const getStudioSession = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) {
    console.error("[studio] auth.getUser failed:", authError.message);
  }

  if (!user) {
    return { supabase, user: null, profile: null, profileError: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) {
    console.error("[studio] profiles lookup failed:", profileError.message);
  }

  return {
    supabase,
    user,
    profile: (profile ?? null) as StudioProfile | null,
    profileError,
  };
});
