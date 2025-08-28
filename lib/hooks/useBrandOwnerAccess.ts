import { useState, useEffect, useCallback, useRef } from "react";
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

  // Force refresh function
  forceRefresh: () => Promise<void>;
}

export function useBrandOwnerAccess(): BrandOwnerAccess {
  const { user } = useAuth();
  const supabase = createClientComponentClient<Database>();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add refs to track fetch state and prevent duplicate calls
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const FETCH_DEBOUNCE_MS = 1000; // Prevent fetches more frequent than 1 second

  const fetchUserData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Prevent duplicate concurrent fetches
    if (isFetchingRef.current) {
      console.log(
        "🔄 useBrandOwnerAccess: Fetch already in progress, skipping..."
      );
      return;
    }

    // Debounce rapid successive calls
    const now = Date.now();
    if (now - lastFetchTimeRef.current < FETCH_DEBOUNCE_MS) {
      console.log("🔄 useBrandOwnerAccess: Fetch too recent, skipping...");
      return;
    }

    try {
      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;
      setError(null);

      console.log("📊 useBrandOwnerAccess: Fetching user data for:", user.id);

      // Get profile and permissions in parallel
      const [profileData, permissionsData] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        getUserPermissions(user.id),
      ]);

      if (profileData.error) {
        console.error("❌ Profile fetch error:", profileData.error);
        // Don't throw, just log and use fallback
        setUserProfile(null);
      } else {
        setUserProfile(profileData.data);
      }

      setUserPermissions(permissionsData);
      console.log("✅ useBrandOwnerAccess: User data loaded successfully");
    } catch (err) {
      console.error("❌ useBrandOwnerAccess: Error fetching user data:", err);
      setError("Failed to load user data");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.id]); // Only depend on user.id, not the entire user object

  // Force refresh function that bypasses debouncing
  const forceRefresh = useCallback(async () => {
    console.log("🔄 useBrandOwnerAccess: Force refresh requested");
    isFetchingRef.current = false;
    lastFetchTimeRef.current = 0;
    await fetchUserData();
  }, [fetchUserData]);

  // Initial fetch - only when user.id changes
  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    } else {
      setLoading(false);
      setUserProfile(null);
      setUserPermissions([]);
    }
  }, [user?.id]); // Only depend on user.id

  // Set up real-time subscription for profile updates - simplified
  useEffect(() => {
    if (!user?.id) return;

    console.log(
      "📡 useBrandOwnerAccess: Setting up profile update subscription for:",
      user.id
    );

    const subscription = supabase
      .channel(`brand_access_updates_${user.id}`)
      .on("broadcast", { event: "profile_updated" }, async (payload) => {
        console.log(
          "📡 useBrandOwnerAccess: Received profile update:",
          payload
        );

        if (payload.payload?.user_id === user.id) {
          console.log(
            "🔄 useBrandOwnerAccess: Profile update for current user, refreshing access..."
          );
          // Use timeout to prevent immediate re-renders
          setTimeout(() => {
            forceRefresh();
          }, 200);
        }
      })
      .subscribe((status) => {
        console.log("📡 useBrandOwnerAccess: Subscription status:", status);
      });

    return () => {
      subscription.unsubscribe();
      console.log("🔌 useBrandOwnerAccess: Unsubscribed from profile updates");
    };
  }, [user?.id]); // Only depend on user.id, not forceRefresh

  // Memoized derived values to prevent unnecessary recalculations
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

  // Debug logging for derived values (only log when values actually change)
  useEffect(() => {
    // Only log in development mode
    if (process.env.NODE_ENV === "development") {
      console.log("🎯 useBrandOwnerAccess: Derived values:", {
        isBrandOwner,
        isAdmin,
        ownedBrandIds,
        canManageBrands,
        effectiveProfileRole: effectiveProfile.role,
        userProfileExists: !!userProfile,
      });
    }
  }, [
    isBrandOwner,
    isAdmin,
    ownedBrandIds.join(","),
    canManageBrands,
    effectiveProfile.role,
    !!userProfile,
  ]);

  // Memoized utility functions to prevent recreation on every render
  const filterBrandsByOwnership = useCallback(
    (brands: Brand[]): Brand[] => {
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
            filteredBrands: filtered.map((b: { name: string; id: string }) => `${b.name} (${b.id})`),
          }
        );
        return filtered;
      }

      console.log(
        "🚫 filterBrandsByOwnership: No access - returning empty array"
      );
      return []; // No access for other roles
    },
    [isAdmin, isBrandOwner, ownedBrandIds]
  );

  const filterCataloguesByOwnership = useCallback(
    (catalogues: Catalogue[]): Catalogue[] => {
      if (isAdmin) {
        return catalogues; // Admins see all catalogues
      }

      if (isBrandOwner && ownedBrandIds.length > 0) {
        return catalogues.filter((catalogue) =>
          ownedBrandIds.includes(catalogue.brand_id)
        );
      }

      return []; // No access for other roles
    },
    [isAdmin, isBrandOwner, ownedBrandIds]
  );

  const canAccessBrand = useCallback(
    (brandId: string): boolean => {
      if (isAdmin) return true;
      if (isBrandOwner) return ownedBrandIds.includes(brandId);
      return false;
    },
    [isAdmin, isBrandOwner, ownedBrandIds]
  );

  const canAccessCatalogue = useCallback(
    (catalogue: Catalogue): boolean => {
      if (isAdmin) return true;
      if (isBrandOwner) {
        return ownedBrandIds.includes(catalogue.brand_id);
      }
      return false;
    },
    [isAdmin, isBrandOwner, ownedBrandIds]
  );

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

    // Force refresh function
    forceRefresh,
  };
}
