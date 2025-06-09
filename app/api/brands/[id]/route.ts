import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("🗑️ Brand deletion API called for brand ID:", params.id);

    const supabase = createRouteHandlerClient({ cookies });
    const brandId = params.id;

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("👤 User authentication check:", {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message,
    });

    if (authError || !user) {
      console.log("❌ Authentication failed");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, owned_brands")
      .eq("id", user.id)
      .single();

    console.log("👤 User profile check:", {
      hasProfile: !!profile,
      role: profile?.role,
      ownedBrands: profile?.owned_brands,
      profileError: profileError?.message,
    });

    if (profileError || !profile) {
      console.log("❌ Profile not found");
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this brand
    const isAdmin = profile.role === "admin" || profile.role === "super_admin";
    const isBrandOwner =
      profile.role === "brand_admin" && profile.owned_brands?.includes(brandId);

    console.log("🔐 Permission check:", {
      isAdmin,
      isBrandOwner,
      userRole: profile.role,
      brandId,
      ownedBrands: profile.owned_brands,
      canDelete: isAdmin || isBrandOwner,
    });

    if (!isAdmin && !isBrandOwner) {
      console.log("❌ Permission denied");
      return NextResponse.json(
        { error: "You don't have permission to delete this brand" },
        { status: 403 }
      );
    }

    // Get the brand to verify it exists
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name")
      .eq("id", brandId)
      .single();

    console.log("🏷️ Brand verification:", {
      brandFound: !!brand,
      brandName: brand?.name,
      brandError: brandError?.message,
    });

    if (brandError || !brand) {
      console.log("❌ Brand not found");
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Use service role client for deletion to bypass RLS
    const { createClient } = require("@supabase/supabase-js");
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log("🔧 Using admin client for deletion");

    // Delete the brand using admin client
    const { error: deleteError } = await supabaseAdmin
      .from("brands")
      .delete()
      .eq("id", brandId);

    console.log("🗑️ Brand deletion result:", {
      success: !deleteError,
      deleteError: deleteError?.message,
      deleteErrorCode: deleteError?.code,
    });

    if (deleteError) {
      console.error("❌ Error deleting brand:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete brand: " + deleteError.message },
        { status: 500 }
      );
    }

    // If user is a brand owner, remove the brand from their owned_brands array
    if (isBrandOwner) {
      console.log("🔄 Updating user's owned_brands array");
      const updatedOwnedBrands =
        profile.owned_brands?.filter((id: string) => id !== brandId) || [];

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ owned_brands: updatedOwnedBrands })
        .eq("id", user.id);

      console.log("👤 Profile update result:", {
        success: !updateError,
        updateError: updateError?.message,
        newOwnedBrands: updatedOwnedBrands,
      });

      if (updateError) {
        console.warn(
          "⚠️ Warning: Could not update user's owned_brands array:",
          updateError
        );
        // Don't fail the request for this, as the brand is already deleted
      }
    }

    console.log("✅ Brand deletion completed successfully");
    return NextResponse.json(
      { message: `Brand "${brand.name}" deleted successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error in brand deletion API:", error);
    return NextResponse.json(
      {
        error:
          "Internal server error: " +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  }
}
