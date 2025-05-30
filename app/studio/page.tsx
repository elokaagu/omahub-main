"use client";

import { useEffect, useState } from "react";
import { Brand } from "@/lib/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import BrandManagement from "@/components/studio/BrandManagement";
import { UserRole } from "@/lib/services/authService";
import { Package } from "@/components/ui/icons";

export default function StudioPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchData() {
      try {
        // Get current user
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser) {
          setLoading(false);
          return;
        }

        setUser(currentUser);

        // Get user profile
        const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("*, owned_brands")
          .eq("id", currentUser.id)
          .single();

        if (profileError) {
          console.error("Error loading profile:", profileError);
          setLoading(false);
          return;
        }

        setProfile(userProfile);

        // Get brands based on user role
        const userRole: UserRole = userProfile.role || "user";
        if (userRole === "admin") {
          const { data: allBrands, error } = await supabase
            .from("brands")
            .select("*")
            .order("name");

          if (!error) {
            setBrands(allBrands || []);
          }
        } else if (
          userRole === "brand_owner" &&
          userProfile.owned_brands?.length
        ) {
          const { data: ownedBrands, error } = await supabase
            .from("brands")
            .select("*")
            .in("id", userProfile.owned_brands)
            .order("name");

          if (!error) {
            setBrands(ownedBrands || []);
          }
        }
      } catch (error) {
        console.error("Error in StudioPage:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

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

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Profile Not Found</h3>
          <p className="mt-2 text-gray-500">
            Your profile could not be found. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  const userRole: UserRole = profile.role || "user";

  if (userRole === "user") {
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
      <h1 className="text-4xl font-canela mb-8 text-oma-plum">
        {userRole === "admin" ? "Studio Admin" : "Brand Management"}
      </h1>

      <BrandManagement
        initialBrands={brands}
        userRole={userRole}
        userId={user.id}
      />
    </div>
  );
}
