import { Brand } from "@/lib/supabase";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import BrandManagement from "@/components/studio/BrandManagement";
import { UserRole } from "@/lib/services/authService";
import { Package } from "@/components/ui/icons";

async function getBrands(userId: string, role: string) {
  const supabase = createServerComponentClient({ cookies });

  try {
    if (role === "admin") {
      const { data: allBrands, error } = await supabase
        .from("brands")
        .select("*")
        .order("name");

      if (error) throw error;
      return allBrands || [];
    } else if (role === "brand_owner") {
      // First get the user's owned brands
      const { data: profile } = await supabase
        .from("profiles")
        .select("owned_brands")
        .eq("id", userId)
        .single();

      if (!profile?.owned_brands?.length) return [];

      // Then fetch those brands
      const { data: ownedBrands, error } = await supabase
        .from("brands")
        .select("*")
        .in("id", profile.owned_brands)
        .order("name");

      if (error) throw error;
      return ownedBrands || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching brands:", error);
    return [];
  }
}

export default async function StudioPage() {
  try {
    const supabase = createServerComponentClient({ cookies });

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*, owned_brands")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error loading profile:", profileError);
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-600">Error</h3>
            <p className="mt-2 text-gray-500">
              There was an error loading your profile. Please try again later.
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

    // Get brands based on user role
    const brands = await getBrands(user.id, userRole);

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
  } catch (error) {
    console.error("Error in StudioPage:", error);
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600">Error</h3>
          <p className="mt-2 text-gray-500">
            An unexpected error occurred. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
