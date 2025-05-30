import { Brand } from "@/lib/supabase";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import BrandManagement from "@/components/studio/BrandManagement";
import { UserRole } from "@/lib/services/authService";

export default async function StudioPage() {
  try {
    const supabase = createServerComponentClient({ cookies });

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return <div>Please sign in to access the studio.</div>;
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*, owned_brands")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Error loading profile:", profileError);
      return <div>Error loading profile.</div>;
    }

    // Get all brands for admins, or owned brands for brand owners
    let brands: Brand[] = [];
    if (profile.role === "admin") {
      const { data: allBrands, error } = await supabase
        .from("brands")
        .select("*")
        .order("name");
      if (error) {
        console.error("Error fetching brands:", error);
        return <div>Error loading brands.</div>;
      }
      brands = allBrands || [];
    } else if (profile.role === "brand_owner" && profile.owned_brands) {
      const { data: allBrands, error } = await supabase
        .from("brands")
        .select("*")
        .order("name");
      if (error) {
        console.error("Error fetching brands:", error);
        return <div>Error loading brands.</div>;
      }
      brands = (allBrands || []).filter((brand) =>
        profile.owned_brands?.includes(brand.id)
      );
    }

    const userRole: UserRole = profile.role || "user";

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">
          {userRole === "admin" ? "Studio Admin" : "Brand Management"}
        </h1>

        {userRole === "user" ? (
          <div>You don't have permission to access the studio.</div>
        ) : (
          <BrandManagement
            brands={brands}
            userRole={userRole}
            userId={user.id}
          />
        )}
      </div>
    );
  } catch (error) {
    console.error("Error in StudioPage:", error);
    return <div>An error occurred while loading the studio.</div>;
  }
}
