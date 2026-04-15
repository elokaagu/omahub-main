import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

export type LeadsAdminProfile = {
  role: string;
  /** Normalised to an array (empty if null/missing). */
  owned_brands: string[];
};

export type LeadsAdminContext = {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  userId: string;
  profile: LeadsAdminProfile;
};

export type RequireLeadsAdminResult =
  | { ok: true; ctx: LeadsAdminContext }
  | { ok: false; response: NextResponse };

/**
 * Authenticate via session, load profile, require super_admin or brand_admin.
 *
 * Breaking change vs legacy email allowlists: callers must have a `profiles` row.
 * Super-admins need `profiles.role = 'super_admin'` (not only Auth metadata).
 * Brand admins need `role = 'brand_admin'` and correct `owned_brands` for scoped RLS.
 *
 * Stricter request bodies: Zod `.strict()` on admin payloads rejects unknown keys (400 + flatten).
 */
export async function requireLeadsAdmin(): Promise<RequireLeadsAdminResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Session invalid - please sign in again" },
        { status: 401 }
      ),
    };
  }

  if (!user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const userId = user.id;

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("role, owned_brands")
    .eq("id", userId)
    .single();

  if (profileError || !profileData) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Profile not found" }, { status: 404 }),
    };
  }

  if (!["super_admin", "brand_admin"].includes(profileData.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Access denied" }, { status: 403 }),
    };
  }

  const owned = Array.isArray(profileData.owned_brands)
    ? profileData.owned_brands
    : [];

  return {
    ok: true,
    ctx: {
      supabase,
      userId,
      profile: {
        role: profileData.role,
        owned_brands: owned,
      },
    },
  };
}
