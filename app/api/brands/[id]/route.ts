import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const brandId = params.id;

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this brand
    const isAdmin = profile.role === "admin" || profile.role === "super_admin";
    const isBrandOwner =
      profile.role === "brand_admin" && profile.owned_brands?.includes(brandId);

    if (!isAdmin && !isBrandOwner) {
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

    if (brandError || !brand) {
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

    // Delete the brand using admin client
    const { error: deleteError } = await supabaseAdmin
      .from("brands")
      .delete()
      .eq("id", brandId);

    if (deleteError) {
      console.error("Error deleting brand:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete brand" },
        { status: 500 }
      );
    }

    // If user is a brand owner, remove the brand from their owned_brands array
    if (isBrandOwner) {
      const updatedOwnedBrands =
        profile.owned_brands?.filter((id: string) => id !== brandId) || [];

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ owned_brands: updatedOwnedBrands })
        .eq("id", user.id);

      if (updateError) {
        console.warn(
          "Warning: Could not update user's owned_brands array:",
          updateError
        );
        // Don't fail the request for this, as the brand is already deleted
      }
    }

    return NextResponse.json(
      { message: `Brand "${brand.name}" deleted successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in brand deletion API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
