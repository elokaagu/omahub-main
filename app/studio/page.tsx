"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-unified";
import type { Database } from "@/lib/types/supabase";
import LeadsTrackingDashboard from "@/components/studio/LeadsTrackingDashboard";
import RecentAccountsWidget from "./dashboard/RecentAccountsWidget";
import {
  getUserPermissions,
  Permission,
} from "@/lib/services/permissionsService";
import { Package, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Loading } from "@/components/ui/loading";
import { supabaseHelpers } from "@/lib/utils/supabase-helpers";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function StudioPage() {
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchData() {
      try {
        if (!user) {
          console.log("👤 Studio Page: No user found");
          setLoading(false);
          return;
        }

        console.log("🔄 Studio Page: Starting data fetch for user:", {
          userId: user.id,
          userEmail: user.email,
          userRole: user.role,
          userOwnedBrands: user.owned_brands,
        });

        // Get user permissions and profile directly without refreshing
        const [permissions, profileResult] = await Promise.all([
          getUserPermissions(user.id, user.email),
          supabaseHelpers.getProfileById(user.id),
        ]);

        console.log("✅ Studio Page: Permissions received:", permissions);
        setUserPermissions(permissions);

        let profile = profileResult.data;

        if (profileResult.error) {
          console.error(
            "❌ Studio Page: Error fetching profile:",
            profileResult.error
          );
          console.log("🔄 Studio Page: Using user context as fallback");
          // Use user context as fallback
          profile = {
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
          setUserProfile(profile);
        } else {
          console.log("👤 Studio Page: Profile fetched:", {
            role: profile?.role,
            ownedBrands: profile?.owned_brands,
          });
          setUserProfile(profile);
        }
      } catch (error) {
        console.error("❌ Studio Page: Error in fetchData:", error);
      } finally {
        setLoading(false);
      }
    }

    // Only fetch data when user changes
    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]); // Simplified dependency array - only user

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold">Please Sign In</h3>
          <p className="mt-2 text-gray-500">
            You need to be signed in to access the studio.
          </p>
        </div>
      </div>
    );
  }

  if (!userPermissions.includes("studio.access")) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold">Access Denied</h3>
          <p className="mt-2 text-gray-500">
            You don't have permission to access the studio.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            User: {user.email} | Role: {user.role} | Permissions:{" "}
            {userPermissions.join(", ")}
          </p>
        </div>
      </div>
    );
  }

  // Use profile data or fallback to user context
  const effectiveProfile = userProfile || {
    role: user.role,
    owned_brands: user.owned_brands || [],
  };

  const isSuperAdmin = effectiveProfile.role === "super_admin";
  const isAdmin =
    effectiveProfile.role === "admin" ||
    effectiveProfile.role === "super_admin";
  const isBrandOwner = effectiveProfile.role === "brand_admin";
  const ownedBrandIds = effectiveProfile.owned_brands || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <h1 className="text-4xl font-canela mb-8 text-oma-plum">Studio</h1>

      {/* Leads Tracking Dashboard */}
      {(isSuperAdmin || isAdmin || isBrandOwner) && (
        <div className="grid grid-cols-1 gap-8">
          <LeadsTrackingDashboard
            userRole={effectiveProfile.role}
            ownedBrandIds={ownedBrandIds}
          />
        </div>
      )}

      {/* Recent Accounts Widget for Super Admins */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 gap-8">
          <RecentAccountsWidget />
        </div>
      )}

      {/* Welcome Message for users without dashboard access */}
      {!isSuperAdmin && !isAdmin && !isBrandOwner && (
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Welcome to OmaHub Studio
          </h3>
          <p className="text-gray-600">
            Your studio dashboard will be available once your account is
            configured.
          </p>
        </div>
      )}
    </div>
  );
}
