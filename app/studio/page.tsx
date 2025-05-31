"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/types/supabase";
import BrandManagement from "@/components/studio/BrandManagement";
import {
  getUserPermissions,
  Permission,
} from "@/lib/services/permissionsService";
import { Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
        if (!user) {
          setLoading(false);
          return;
        }

        // Get user permissions
        const permissions = await getUserPermissions(user.id);
        setUserPermissions(permissions);

        // Get brands if user has permission
        if (permissions.includes("studio.brands.manage")) {
          const { data: fetchedBrands, error } = await supabase
            .from("brands")
            .select("*")
            .order("name");

          if (error) throw error;
          setBrands(fetchedBrands || []);
        }
      } catch (error) {
        console.error("Error in StudioPage:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-oma-plum"></div>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-canela mb-8 text-oma-plum">Studio</h1>

      {userPermissions.includes("studio.brands.manage") && (
        <BrandManagement
          initialBrands={brands}
          userPermissions={userPermissions}
          userId={user.id}
        />
      )}
    </div>
  );
}
