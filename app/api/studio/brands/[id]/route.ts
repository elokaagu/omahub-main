import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const brandId = params.id;

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to update this brand
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

    const isAdmin = ["admin", "super_admin"].includes(profile.role);
    const isBrandOwner = profile.owned_brands?.includes(brandId);

    if (!isAdmin && !isBrandOwner) {
      return NextResponse.json(
        { error: "Insufficient permissions to update this brand" },
        { status: 403 }
      );
    }

    // Get the update data
    const updateData = await request.json();

    // Validate brand name length if it's being updated
    if (updateData.name && updateData.name.length > 50) {
      return NextResponse.json(
        { error: "Brand name must be 50 characters or less" },
        { status: 400 }
      );
    }

    // Validate description length if it's being updated
    if (updateData.description && updateData.description.length > 150) {
      return NextResponse.json(
        { error: "Brand description must be 150 characters or less" },
        { status: 400 }
      );
    }

    // Get the current brand data to check if name is changing
    const { data: currentBrand, error: fetchError } = await supabase
      .from("brands")
      .select("name")
      .eq("id", brandId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const isNameChanging =
      updateData.name && updateData.name !== currentBrand.name;

    // Update the brand
    const { data: updatedBrand, error: updateError } = await supabase
      .from("brands")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", brandId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating brand:", updateError);
      return NextResponse.json(
        { error: "Failed to update brand", details: updateError.message },
        { status: 500 }
      );
    }

    // If the brand name changed, update related tables
    if (isNameChanging) {
      console.log(
        `Brand name changed from "${currentBrand.name}" to "${updateData.name}"`
      );

      // Update spotlight content that references this brand by name
      const { error: spotlightError } = await supabase
        .from("spotlight_content")
        .update({ brand_name: updateData.name })
        .eq("brand_name", currentBrand.name);

      if (spotlightError) {
        console.warn("Error updating spotlight content:", spotlightError);
        // Don't fail the entire operation for this
      }

      // Update any other tables that might reference brand names
      // Add more updates here as needed for other tables

      console.log("Brand name propagation completed");
    }

    return NextResponse.json({
      success: true,
      brand: updatedBrand,
      nameChanged: isNameChanging,
    });
  } catch (error) {
    console.error("Brand update API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
