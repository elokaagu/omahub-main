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
 * No email-based fallbacks — users must have a valid profiles row and role.
 */
export async function requireLeadsAdmin(): Promise<RequireLeadsAdminResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Session invalid - please sign in again" },
        { status: 401 }
      ),
    };
  }

  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const userId = session.user.id;

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
