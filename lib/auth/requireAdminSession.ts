import { createServerSupabaseClient } from "@/lib/supabase-unified";

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export type ReviewsAdminProfile = {
  role: string;
  owned_brands: string[];
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

export type RequireReviewsAdminResult =
  | { ok: true; userId: string; supabase: ServerSupabase; profile: ReviewsAdminProfile }
  | { ok: false; status: number; error: string };

/**
 * Studio/admin: authenticated user with super_admin or brand_admin role.
 * Uses unified server Supabase (cookies / session), not Bearer tokens.
 */
export async function requireReviewsAdmin(): Promise<RequireReviewsAdminResult> {
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
    .select("role, owned_brands, first_name, last_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { ok: false, status: 404, error: "User profile not found" };
  }

  if (!["super_admin", "brand_admin"].includes(profile.role)) {
    return { ok: false, status: 403, error: "Insufficient permissions" };
  }

  const owned = Array.isArray(profile.owned_brands) ? profile.owned_brands : [];

  return {
    ok: true,
    userId: user.id,
    supabase,
    profile: {
      role: profile.role,
      owned_brands: owned,
      first_name: profile.first_name ?? null,
      last_name: profile.last_name ?? null,
      email: profile.email ?? null,
    },
  };
}

export function formatAdminDisplayName(profile: ReviewsAdminProfile): string {
  if (profile.first_name && profile.last_name) {
    return `${profile.first_name} ${profile.last_name}`;
  }
  return profile.email ?? "Admin";
}
