import type { User } from "@/lib/services/authService";
import type { Database } from "@/lib/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type CollectionsPageAccess = {
  role: string;
  ownedBrandIds: string[];
  isAdmin: boolean;
  isBrandOwner: boolean;
};

/** Single normalized view of role + ownership after profile + auth reconciliation. */
export function buildCollectionsPageAccess(
  profile: Profile | null,
  user: User
): CollectionsPageAccess {
  const role = String(profile?.role ?? user.role ?? "user");
  const rawOwned = profile?.owned_brands ?? user.owned_brands ?? [];
  const ownedBrandIds = Array.isArray(rawOwned) ? [...rawOwned] : [];

  return {
    role,
    ownedBrandIds,
    isAdmin: role === "admin" || role === "super_admin",
    isBrandOwner: role === "brand_admin",
  };
}

export type DeleteCollectionPermission =
  | { ok: true }
  | { ok: false; message: string };

export function getDeleteCollectionPermission(
  access: CollectionsPageAccess,
  collectionBrandId: string
): DeleteCollectionPermission {
  if (access.isAdmin) {
    return { ok: true };
  }
  if (access.isBrandOwner) {
    if (access.ownedBrandIds.includes(collectionBrandId)) {
      return { ok: true };
    }
    return {
      ok: false,
      message: "You can only delete collections from your own brands",
    };
  }
  return {
    ok: false,
    message: "You don't have permission to delete collections",
  };
}
