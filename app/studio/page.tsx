"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/types/supabase";
import { Brand } from "@/lib/supabase";
import BrandManagement from "@/components/studio/BrandManagement";
import AnalyticsDashboard from "@/components/studio/AnalyticsDashboard";
import {
  getUserPermissions,
  Permission,
} from "@/lib/services/permissionsService";
import { Package, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Loading } from "@/components/ui/loading";
import StudioDebug from "@/components/studio/StudioDebug";
import AuthDiagnostic from "@/components/studio/AuthDiagnostic";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function StudioPage() {
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [ownedBrands, setOwnedBrands] = useState<Brand[]>([]);
  const { user } = useAuth();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    async function fetchData() {
      try {
        console.log("🏠 Studio Page: fetchData starting...");
        console.log("🏠 Studio Page: Current user:", {
          userId: user?.id,
          userEmail: user?.email,
          userRole: user?.role,
          userOwnedBrands: user?.owned_brands,
        });

        if (!user) {
          console.log("🏠 Studio Page: No user, setting loading to false");
          setLoading(false);
          return;
        }

        // Get user permissions - pass both ID and email for better fallback
        console.log("🔍 Studio Page: Getting permissions for user:", user.id);
        const permissions = await getUserPermissions(user.id, user.email);
        console.log("👤 Studio Page: User permissions received:", permissions);
        setUserPermissions(permissions);

        // Get user profile to access owned_brands - but also use user context as fallback
        console.log("👤 Studio Page: Fetching user profile...");
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error(
            "❌ Studio Page: Error fetching profile:",
            profileError
          );
          console.log("🔄 Studio Page: Using user context as fallback");
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
          console.log("👤 Studio Page: Profile fetched:", {
            role: profile?.role,
            ownedBrands: profile?.owned_brands,
          });
          setUserProfile(profile);
        }

        // Use profile data or fallback to user context
        const effectiveProfile = profile || {
          role: user.role,
          owned_brands: user.owned_brands || [],
        };

        const isBrandOwner = effectiveProfile.role === "brand_admin";
        const isAdmin =
          effectiveProfile.role === "admin" ||
          effectiveProfile.role === "super_admin";
        const ownedBrandIds = effectiveProfile.owned_brands || [];

        console.log("🎯 Studio Page: Effective user data:", {
          isBrandOwner,
          isAdmin,
          ownedBrandIds,
          hasManagePermission: permissions.includes("studio.brands.manage"),
        });

        // Get brands based on user role
        if (permissions.includes("studio.brands.manage")) {
          console.log(
            "📦 Studio Page: User can manage brands, fetching brands..."
          );

          if (isAdmin) {
            // Admins see all brands
            const { data: fetchedBrands, error } = await supabase
              .from("brands")
              .select("*")
              .order("name");

            if (error) throw error;
            console.log(
              "📦 Studio Page: All brands fetched:",
              fetchedBrands?.length || 0
            );
            setBrands(fetchedBrands || []);
          } else if (isBrandOwner && ownedBrandIds.length > 0) {
            // Brand owners see only their brands
            console.log(
              "📦 Studio Page: Fetching owned brands:",
              ownedBrandIds
            );
            const { data: fetchedBrands, error } = await supabase
              .from("brands")
              .select("*")
              .in("id", ownedBrandIds)
              .order("name");

            if (error) {
              console.error(
                "❌ Studio Page: Error fetching owned brands:",
                error
              );
              throw error;
            }
            console.log(
              "📦 Studio Page: Owned brands fetched:",
              fetchedBrands?.length || 0,
              fetchedBrands?.map((b) => `${b.name} (${b.id})`)
            );
            setBrands(fetchedBrands || []);
            setOwnedBrands(fetchedBrands || []);
          } else {
            console.log("⚠️ Studio Page: Brand owner with no owned brands");
            setBrands([]);
            setOwnedBrands([]);
          }
        } else {
          console.log("📦 Studio Page: User cannot manage brands");
        }
      } catch (error) {
        console.error("❌ Studio Page: Error in fetchData:", error);
      } finally {
        console.log("🏠 Studio Page: Setting loading to false");
        setLoading(false);
      }
    }

    fetchData();
  }, [user, supabase]);

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
  const ownedBrandNames = brands.map((brand) => brand.name);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <h1 className="text-4xl font-canela mb-8 text-oma-plum">Studio</h1>

      {/* Debug info for troubleshooting */}
      {process.env.NODE_ENV === "development" && (
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded-lg text-xs">
            <p>
              <strong>Debug Info:</strong>
            </p>
            <p>
              User: {user.email} | Role: {effectiveProfile.role}
            </p>
            <p>Owned Brands: {JSON.stringify(ownedBrandIds)}</p>
            <p>Permissions: {userPermissions.join(", ")}</p>
            <p>Brands Loaded: {brands.length}</p>
          </div>

          {/* Authentication Diagnostic */}
          <AuthDiagnostic />

          {/* Detailed Debug Component */}
          <StudioDebug />
        </div>
      )}

      {/* Analytics Dashboard */}
      {(isSuperAdmin || isBrandOwner) && (
        <div className="mb-8">
          <AnalyticsDashboard
            isBrandOwner={isBrandOwner}
            ownedBrandIds={ownedBrandIds}
            brandNames={ownedBrandNames}
          />
        </div>
      )}

      {/* Brand Management Section */}
      {userPermissions.includes("studio.brands.manage") && (
        <div>
          <BrandManagement
            initialBrands={brands}
            userPermissions={userPermissions}
            userId={user.id}
            userRole={effectiveProfile.role}
            ownedBrandIds={ownedBrandIds}
          />
        </div>
      )}

      {/* Empty State for Users Without Permissions */}
      {!isSuperAdmin &&
        !isBrandOwner &&
        !userPermissions.includes("studio.brands.manage") && (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold">Welcome to Studio</h3>
              <p className="mt-2 text-gray-500">
                Your dashboard will appear here once you have the necessary
                permissions.
              </p>
            </div>
          </div>
        )}
    </div>
  );
}
