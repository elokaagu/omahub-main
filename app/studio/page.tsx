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
        });

        if (!user) {
          console.log("🏠 Studio Page: No user, setting loading to false");
          setLoading(false);
          return;
        }

        // Get user permissions
        console.log("🔍 Studio Page: Getting permissions for user:", user.id);
        const permissions = await getUserPermissions(user.id, user.email);
        console.log("👤 Studio Page: User permissions received:", permissions);
        setUserPermissions(permissions);

        // Get user profile to access owned_brands
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
        } else {
          console.log("👤 Studio Page: Profile fetched:", {
            role: profile?.role,
            ownedBrands: profile?.owned_brands,
          });
          setUserProfile(profile);
        }

        const isBrandOwner = user.role === "brand_admin";
        const isAdmin = user.role === "admin" || user.role === "super_admin";
        const ownedBrandIds = profile?.owned_brands || [];

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
            const { data: fetchedBrands, error } = await supabase
              .from("brands")
              .select("*")
              .in("id", ownedBrandIds)
              .order("name");

            if (error) throw error;
            console.log(
              "📦 Studio Page: Owned brands fetched:",
              fetchedBrands?.length || 0
            );
            setBrands(fetchedBrands || []);
            setOwnedBrands(fetchedBrands || []);
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
        </div>
      </div>
    );
  }

  const isSuperAdmin = user.role === "super_admin";
  const isAdmin = user.role === "admin" || user.role === "super_admin";
  const isBrandOwner = user.role === "brand_admin";
  const ownedBrandIds = userProfile?.owned_brands || [];
  const ownedBrandNames = ownedBrands.map((brand) => brand.name);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <h1 className="text-4xl font-canela mb-8 text-oma-plum">Studio</h1>

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
            userRole={user.role}
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
