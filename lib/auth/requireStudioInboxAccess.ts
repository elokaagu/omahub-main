import { createServerSupabaseClient } from "@/lib/supabase-unified";

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabaseClient>>;

const ALLOWED_ROLES = ["super_admin", "brand_admin"] as const;

export type StudioInboxProfile = {
  role: string;
  owned_brands: string[] | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

export type RequireStudioInboxAccessResult =
  | {
      ok: true;
      userId: string;
      userEmail: string | null;
      profile: StudioInboxProfile;
      supabase: ServerSupabase;
    }
  | { ok: false; status: number; error: string };

/**
 * Session user with profiles.role in super_admin | brand_admin.
 * No email-based privilege fallback — profile row must exist and match.
 */
export async function requireStudioInboxAccess(): Promise<RequireStudioInboxAccessResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const { data: row, error: profileError } = await supabase
    .from("profiles")
    .select("role, owned_brands, first_name, last_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !row) {
    return { ok: false, status: 404, error: "Profile not found" };
  }

  if (!ALLOWED_ROLES.includes(row.role as (typeof ALLOWED_ROLES)[number])) {
    return { ok: false, status: 403, error: "Access denied" };
  }

  const profile: StudioInboxProfile = {
    role: row.role,
    owned_brands: row.owned_brands,
    first_name: row.first_name ?? null,
    last_name: row.last_name ?? null,
    email: row.email ?? null,
  };

  return {
    ok: true,
    userId: user.id,
    userEmail: user.email ?? null,
    profile,
    supabase,
  };
}
