import "server-only";
import { createAdminClient } from "@/lib/supabase-unified";
import { getAllBrands } from "@/lib/services/brandService";
import type {
  BrandOption,
  UserProfile,
  UserWithBrands,
} from "@/app/studio/users/types";

/** Same cap the Studio users page has always requested from the API. */
const MAX_USERS = 2000;

/**
 * Everything the Studio users page renders: every profile (service role),
 * with owned brand ids resolved to names, plus the brand picker options.
 * Names resolve against every brand (including unapproved ones a user may
 * already own); the picker lists public brands only, as it always has.
 * Callers must have checked the viewer is a super admin.
 */
export async function loadStudioUsers(): Promise<{
  users: UserWithBrands[];
  brandOptions: BrandOption[];
}> {
  const adminDb = createAdminClient();

  const [profilesResult, allBrandNames, publicBrands] = await Promise.all([
    adminDb
      .from("profiles")
      .select("id, email, role, owned_brands, created_at, updated_at")
      .order("created_at", { ascending: false })
      .range(0, MAX_USERS - 1),
    adminDb.from("brands").select("id, name"),
    getAllBrands(),
  ]);

  if (profilesResult.error) {
    throw new Error(`Failed to load users: ${profilesResult.error.message}`);
  }

  const brandOptions = publicBrands
    .map((brand) => ({ id: brand.id, name: brand.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const nameById = new Map(
    ((allBrandNames.data ?? []) as BrandOption[]).map((b) => [b.id, b.name]),
  );

  const users = ((profilesResult.data ?? []) as UserProfile[]).map((user) => ({
    ...user,
    brand_names: (user.owned_brands ?? [])
      .map((id) => nameById.get(id))
      .filter((name): name is string => Boolean(name)),
  }));

  return { users, brandOptions };
}
