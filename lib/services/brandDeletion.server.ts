import { createAdminClient } from "@/lib/supabase-unified";
import type { createServerSupabaseClient } from "@/lib/supabase-unified";

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export type DeleteBrandResult =
  | { ok: true; brandName: string }
  | { ok: false; status: number; error: string };

/**
 * Deletes a brand (service role) after session auth + permission checks.
 * Matches studio RBAC: `super_admin`, `admin`, or owning `brand_admin`.
 * Removes `brandId` from every profile's `owned_brands` (admin client).
 */
export async function deleteBrandAsUser(
  supabase: ServerSupabase,
  brandId: string
): Promise<DeleteBrandResult> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    return { ok: false, status: 401, error: "Authentication required" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, owned_brands")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error(
      JSON.stringify({
        event: "delete_brand_profile_read_failed",
        code: profileError.code,
      })
    );
    return { ok: false, status: 500, error: "Unable to verify permissions." };
  }

  if (!profile) {
    return { ok: false, status: 404, error: "User profile not found" };
  }

  const canElevatedDelete =
    profile.role === "super_admin" || profile.role === "admin";
  const isBrandOwner =
    profile.role === "brand_admin" &&
    Boolean(profile.owned_brands?.includes(brandId));

  if (!canElevatedDelete && !isBrandOwner) {
    return {
      ok: false,
      status: 403,
      error: "You don't have permission to delete this brand",
    };
  }

  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name")
    .eq("id", brandId)
    .maybeSingle();

  if (brandError) {
    console.error(
      JSON.stringify({
        event: "delete_brand_lookup_failed",
        code: brandError.code,
      })
    );
    return { ok: false, status: 500, error: "Unable to verify brand." };
  }

  if (!brand) {
    return { ok: false, status: 404, error: "Brand not found" };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      status: 503,
      error: "Service temporarily unavailable.",
    };
  }

  const { error: deleteError } = await admin
    .from("brands")
    .delete()
    .eq("id", brandId);

  if (deleteError) {
    console.error(
      JSON.stringify({
        event: "delete_brand_db_failed",
        code: deleteError.code,
        message: deleteError.message,
      })
    );
    return { ok: false, status: 500, error: "Unable to delete brand." };
  }

  console.log(
    JSON.stringify({
      event: "brand_deleted",
      actor_user_id: user.id,
      brand_id: brandId,
      brand_name: brand.name,
      at: new Date().toISOString(),
    })
  );

  await removeBrandFromAllOwnedBrands(admin, brandId);

  return { ok: true, brandName: brand.name };
}

async function removeBrandFromAllOwnedBrands(
  admin: ReturnType<typeof createAdminClient>,
  brandId: string
) {
  const { data: holders, error: holdersError } = await admin
    .from("profiles")
    .select("id, owned_brands")
    .contains("owned_brands", [brandId]);

  if (holdersError) {
    console.error(
      JSON.stringify({
        event: "delete_brand_owned_brands_query_failed",
        code: holdersError.code,
        message: holdersError.message,
      })
    );
    return;
  }

  for (const row of holders ?? []) {
    const ob = row.owned_brands as string[] | null;
    if (!ob?.includes(brandId)) continue;
    const next = ob.filter((x) => x !== brandId);
    const { error: upErr } = await admin
      .from("profiles")
      .update({ owned_brands: next })
      .eq("id", row.id);
    if (upErr) {
      console.error(
        JSON.stringify({
          event: "delete_brand_owned_cleanup_failed",
          profile_id: row.id,
          code: upErr.code,
        })
      );
    }
  }
}
