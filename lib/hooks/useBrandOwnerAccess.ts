import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/types/supabase";
import {
  getUserPermissions,
  Permission,
} from "@/lib/services/permissionsService";
import { Brand, Catalogue } from "@/lib/supabase";

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
  canManageCatalogues: boolean;
  canManageSettings: boolean;

  // Loading states
  loading: boolean;
  error: string | null;

  // Utility functions
  filterBrandsByOwnership: (brands: Brand[]) => Brand[];
  filterCataloguesByOwnership: (catalogues: Catalogue[]) => Catalogue[];
  canAccessBrand: (brandId: string) => boolean;
  canAccessCatalogue: (catalogue: Catalogue) => boolean;

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
      console.log("🔍 useBrandOwnerAccess: No user, setting loading to false");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("🔍 useBrandOwnerAccess: Fetching data for user:", {
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        userOwnedBrands: user.owned_brands,
      });

      // Get user permissions and profile
      const [permissions, profileResult] = await Promise.all([
        getUserPermissions(user.id, user.email),
        supabase.from("profiles").select("*").eq("id", user.id).single(),
      ]);

      console.log("✅ useBrandOwnerAccess: Permissions received:", permissions);
      setUserPermissions(permissions);

      if (profileResult.error) {
        console.error(
          "❌ useBrandOwnerAccess: Error fetching profile:",
          profileResult.error
        );
        console.log("🔄 useBrandOwnerAccess: Using user context as fallback");

        // Use user context as fallback
        const fallbackProfile = {
          id: user.id,
          email: user.email,
          role: user.role || "user",
          owned_brands: user.owned_brands || [],
          first_name: user.first_name || null,
          last_name: user.last_name || null,
          avatar_url: user.avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Profile;

        console.log("🔄 useBrandOwnerAccess: Fallback profile:", {
          role: fallbackProfile.role,
          owned_brands: fallbackProfile.owned_brands,
        });

        setUserProfile(fallbackProfile);
      } else {
        console.log("✅ useBrandOwnerAccess: Profile fetched successfully:", {
          role: profileResult.data.role,
          owned_brands: profileResult.data.owned_brands,
        });
        setUserProfile(profileResult.data);
      }
    } catch (err) {
      console.error("❌ useBrandOwnerAccess: Error fetching user data:", err);
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
  const canManageCatalogues = userPermissions.includes(
    "studio.catalogues.manage"
  );
  const canManageSettings = userPermissions.includes("studio.settings.manage");

  // Debug logging for derived values
  console.log("🎯 useBrandOwnerAccess: Derived values:", {
    isBrandOwner,
    isAdmin,
    ownedBrandIds,
    canManageBrands,
    effectiveProfileRole: effectiveProfile.role,
    userProfileExists: !!userProfile,
  });

  // Utility functions
  const filterBrandsByOwnership = (brands: Brand[]): Brand[] => {
    console.log("🔍 filterBrandsByOwnership: Input brands:", brands.length);
    console.log("🔍 filterBrandsByOwnership: User access:", {
      isAdmin,
      isBrandOwner,
      ownedBrandIds,
    });

    if (isAdmin) {
      console.log(
        "👑 filterBrandsByOwnership: Admin access - returning all brands"
      );
      return brands; // Admins see all brands
    }

    if (isBrandOwner && ownedBrandIds.length > 0) {
      const filtered = brands.filter((brand) =>
        ownedBrandIds.includes(brand.id)
      );
      console.log(
        "🏷️ filterBrandsByOwnership: Brand owner access - filtered brands:",
        {
          totalBrands: brands.length,
          ownedBrandIds,
          filteredCount: filtered.length,
          filteredBrands: filtered.map((b) => `${b.name} (${b.id})`),
        }
      );
      return filtered;
    }

    console.log(
      "🚫 filterBrandsByOwnership: No access - returning empty array"
    );
    return []; // No access for other roles
  };

  const filterCataloguesByOwnership = (
    catalogues: Catalogue[]
  ): Catalogue[] => {
    if (isAdmin) {
      return catalogues; // Admins see all catalogues
    }

    if (isBrandOwner && ownedBrandIds.length > 0) {
      return catalogues.filter((catalogue) =>
        ownedBrandIds.includes(catalogue.brand_id)
      );
    }

    return []; // No access for other roles
  };

  const canAccessBrand = (brandId: string): boolean => {
    if (isAdmin) return true;
    if (isBrandOwner) return ownedBrandIds.includes(brandId);
    return false;
  };

  const canAccessCatalogue = (catalogue: Catalogue): boolean => {
    if (isAdmin) return true;
    if (isBrandOwner) {
      return ownedBrandIds.includes(catalogue.brand_id);
    }
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
    canManageCatalogues,
    canManageSettings,

    // Loading states
    loading,
    error,

    // Utility functions
    filterBrandsByOwnership,
    filterCataloguesByOwnership,
    canAccessBrand,
    canAccessCatalogue,

    // Refresh function
    refresh: fetchUserData,
  };
}
