import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("🔄 Brand update request received for ID:", params.id);

    const supabase = await createServerSupabaseClient();
    const brandId = params.id;

    // Get the current user with enhanced error handling
    console.log("🔍 Checking user authentication...");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log("👤 Authentication result:", {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      error: userError?.message,
    });

    if (userError) {
      console.log("❌ Authentication error:", userError.message);
      return NextResponse.json(
        { error: "Authentication failed", details: userError.message },
        { status: 401 }
      );
    }

    if (!user) {
      console.log("❌ No user session found");
      return NextResponse.json(
        { error: "No active session. Please log in first." },
        { status: 401 }
      );
    }

    // Check if user has permission to update this brand
    console.log("🔍 Checking user permissions...");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, owned_brands")
      .eq("id", user.id)
      .single();

    console.log("👤 Profile result:", {
      hasProfile: !!profile,
      role: profile?.role,
      ownedBrands: profile?.owned_brands,
      error: profileError?.message,
    });

    if (profileError) {
      console.log("❌ Profile fetch error:", profileError.message);
      return NextResponse.json(
        {
          error: "Failed to fetch user profile",
          details: profileError.message,
        },
        { status: 500 }
      );
    }

    if (!profile) {
      console.log("❌ User profile not found");
      return NextResponse.json(
        { error: "User profile not found. Please contact support." },
        { status: 404 }
      );
    }

    const isAdmin = ["admin", "super_admin"].includes(profile.role);
    const isBrandOwner = profile.owned_brands?.includes(brandId);

    console.log("🔐 Permission check:", {
      isAdmin,
      isBrandOwner,
      brandId,
      userRole: profile.role,
      ownedBrands: profile.owned_brands,
    });

    if (!isAdmin && !isBrandOwner) {
      console.log("❌ Insufficient permissions");
      return NextResponse.json(
        {
          error: "Insufficient permissions to update this brand",
          userRole: profile.role,
          requiredRole: "admin, super_admin, or brand owner",
        },
        { status: 403 }
      );
    }

    // Get the update data
    const updateData = await request.json();
    console.log("📝 Update data received:", Object.keys(updateData));

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
    console.log("🔍 Fetching current brand data...");
    const { data: currentBrand, error: fetchError } = await supabase
      .from("brands")
      .select("name")
      .eq("id", brandId)
      .single();

    if (fetchError) {
      console.log("❌ Brand not found:", fetchError.message);
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const isNameChanging =
      updateData.name && updateData.name !== currentBrand.name;

    console.log("📊 Brand name changing:", isNameChanging);

    // Update the brand
    console.log("💾 Updating brand in database...");
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
      console.error("❌ Error updating brand:", updateError);
      return NextResponse.json(
        { error: "Failed to update brand", details: updateError.message },
        { status: 500 }
      );
    }

    console.log("✅ Brand updated successfully");

    // If the brand name changed, update related tables
    if (isNameChanging) {
      console.log(
        `🔄 Brand name changed from "${currentBrand.name}" to "${updateData.name}"`
      );

      // Update spotlight content that references this brand by name
      const { error: spotlightError } = await supabase
        .from("spotlight_content")
        .update({ brand_name: updateData.name })
        .eq("brand_name", currentBrand.name);

      if (spotlightError) {
        console.warn("⚠️ Error updating spotlight content:", spotlightError);
        // Don't fail the entire operation for this
      } else {
        console.log("✅ Spotlight content updated");
      }

      console.log("✅ Brand name propagation completed");
    }

    console.log("🎉 Brand update operation completed successfully");
    return NextResponse.json({
      success: true,
      brand: updatedBrand,
      nameChanged: isNameChanging,
    });
  } catch (error) {
    console.error("❌ Brand update API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
