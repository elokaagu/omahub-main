import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/types/supabase";
import {
  getUserPermissions,
  Permission,
} from "@/lib/services/permissionsService";
import { Brand, Collection } from "@/lib/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface BrandOwnerAccess {
  // User info
  user: any;
  userProfile: Profile | null;
  userPermissions: Permission[];

  // Role checks
  isBrandOwner: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;

  // Brand access
  ownedBrandIds: string[];
  canManageBrands: boolean;
  canManageCollections: boolean;
  canManageSettings: boolean;

  // Loading states
  loading: boolean;
  error: string | null;

  // Utility functions
  filterBrandsByOwnership: (brands: Brand[]) => Brand[];
  filterCollectionsByOwnership: (collections: Collection[]) => Collection[];
  canAccessBrand: (brandId: string) => boolean;
  canAccessCollection: (collection: Collection) => boolean;

  // Refresh function
  refresh: () => Promise<void>;
}

export function useBrandOwnerAccess(): BrandOwnerAccess {
  const { user } = useAuth();
  const supabase = createClientComponentClient<Database>();

  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get user permissions and profile
      const [permissions, profileResult] = await Promise.all([
        getUserPermissions(user.id, user.email),
        supabase.from("profiles").select("*").eq("id", user.id).single(),
      ]);

      setUserPermissions(permissions);

      if (profileResult.error) {
        console.error("Error fetching profile:", profileResult.error);
        // Use user context as fallback
        setUserProfile({
          id: user.id,
          email: user.email,
          role: user.role || "user",
          owned_brands: user.owned_brands || [],
          first_name: user.first_name || null,
          last_name: user.last_name || null,
          avatar_url: user.avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Profile);
      } else {
        setUserProfile(profileResult.data);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  // Derived values
  const effectiveProfile = userProfile || {
    role: user?.role || "user",
    owned_brands: user?.owned_brands || [],
  };

  const isBrandOwner = effectiveProfile.role === "brand_admin";
  const isAdmin =
    effectiveProfile.role === "admin" ||
    effectiveProfile.role === "super_admin";
  const isSuperAdmin = effectiveProfile.role === "super_admin";
  const ownedBrandIds = effectiveProfile.owned_brands || [];

  // Permission checks
  const canManageBrands = userPermissions.includes("studio.brands.manage");
  const canManageCollections = userPermissions.includes(
    "studio.collections.manage"
  );
  const canManageSettings = userPermissions.includes("studio.settings.manage");

  // Utility functions
  const filterBrandsByOwnership = (brands: Brand[]): Brand[] => {
    if (isAdmin) {
      return brands; // Admins see all brands
    }

    if (isBrandOwner && ownedBrandIds.length > 0) {
      return brands.filter((brand) => ownedBrandIds.includes(brand.id));
    }

    return []; // No access for other roles
  };

  const filterCollectionsByOwnership = (
    collections: Collection[]
  ): Collection[] => {
    if (isAdmin) {
      return collections; // Admins see all collections
    }

    if (isBrandOwner && ownedBrandIds.length > 0) {
      return collections.filter((collection) =>
        ownedBrandIds.includes(collection.brand_id)
      );
    }

    return []; // No access for other roles
  };

  const canAccessBrand = (brandId: string): boolean => {
    if (isAdmin) return true;
    if (isBrandOwner) return ownedBrandIds.includes(brandId);
    return false;
  };

  const canAccessCollection = (collection: Collection): boolean => {
    if (isAdmin) return true;
    if (isBrandOwner) return ownedBrandIds.includes(collection.brand_id);
    return false;
  };

  return {
    // User info
    user,
    userProfile,
    userPermissions,

    // Role checks
    isBrandOwner,
    isAdmin,
    isSuperAdmin,

    // Brand access
    ownedBrandIds,
    canManageBrands,
    canManageCollections,
    canManageSettings,

    // Loading states
    loading,
    error,

    // Utility functions
    filterBrandsByOwnership,
    filterCollectionsByOwnership,
    canAccessBrand,
    canAccessCollection,

    // Refresh function
    refresh: fetchUserData,
  };
}
