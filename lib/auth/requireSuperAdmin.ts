import { createServerSupabaseClient } from "@/lib/supabase-unified";

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export type RequireSuperAdminResult =
  | { ok: true; userId: string; supabase: ServerSupabase }
  | { ok: false; status: number; error: string };

/**
 * Session-authenticated user with profiles.role === super_admin.
 * Uses the unified server client (full cookie adapter); no service role.
 */
export async function requireSuperAdmin(): Promise<RequireSuperAdminResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    return { ok: false, status: 401, error: "Not authenticated" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "super_admin") {
    return { ok: false, status: 403, error: "Insufficient permissions" };
  }

  return { ok: true, userId: user.id, supabase };
}
