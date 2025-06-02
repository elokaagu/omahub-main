"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/types/supabase";
import BrandManagement from "@/components/studio/BrandManagement";
import AnalyticsDashboard from "@/components/studio/AnalyticsDashboard";
import {
  getUserPermissions,
  Permission,
} from "@/lib/services/permissionsService";
import { Package, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Loading } from "@/components/ui/loading";

type Brand = Database["public"]["Tables"]["brands"]["Row"];

export default function StudioPage() {
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
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
        console.log(
          "🔐 Studio Page: Has studio.access?",
          permissions.includes("studio.access")
        );
        setUserPermissions(permissions);

        // Get brands if user has permission
        if (permissions.includes("studio.brands.manage")) {
          console.log(
            "📦 Studio Page: User can manage brands, fetching brands..."
          );
          const { data: fetchedBrands, error } = await supabase
            .from("brands")
            .select("*")
            .order("name");

          if (error) throw error;
          console.log(
            "📦 Studio Page: Brands fetched:",
            fetchedBrands?.length || 0
          );
          setBrands(fetchedBrands || []);
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

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-4xl font-canela mb-8 text-oma-plum">Studio</h1>

      {/* Analytics Dashboard for Super Admins */}
      {isSuperAdmin && (
        <div className="mb-8">
          <AnalyticsDashboard userId={user.id} />
        </div>
      )}

      {/* Brand Management Section */}
      {userPermissions.includes("studio.brands.manage") && (
        <div>
          <BrandManagement
            initialBrands={brands}
            userPermissions={userPermissions}
            userId={user.id}
          />
        </div>
      )}

      {/* Empty State for Users Without Permissions */}
      {!isSuperAdmin && !userPermissions.includes("studio.brands.manage") && (
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
