import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";
import { syncProductCurrencies } from "@/lib/utils/currencySync";
import { clearBrandsCache } from "@/lib/services/brandService";

const BRAND_SELECT_FIELDS = [
  "id",
  "name",
  "description",
  "long_description",
  "location",
  "price_range",
  "currency",
  "category",
  "categories",
  "image",
  "website",
  "instagram",
  "whatsapp",
  "founded_year",
  "is_verified",
  "contact_email",
  "updated_at",
  "created_at",
].join(", ");

const ALLOWED_UPDATE_FIELDS = new Set([
  "name",
  "description",
  "long_description",
  "location",
  "price_range",
  "currency",
  "category",
  "categories",
  "image",
  "website",
  "instagram",
  "whatsapp",
  "founded_year",
]);

type ProfileAccess = {
  role: string | null;
  owned_brands: string[] | null;
};

type AuthzResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

async function requireBrandAccess(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  brandId: string
): Promise<AuthzResult> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, owned_brands")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unable to resolve user permissions" },
        { status: 403 }
      ),
    };
  }

  const typedProfile = profile as ProfileAccess;
  const isAdmin = ["admin", "super_admin"].includes(typedProfile.role ?? "");
  const isBrandOwner = (typedProfile.owned_brands ?? []).includes(brandId);
  if (!isAdmin && !isBrandOwner) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }),
    };
  }

  return { ok: true };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const brandId = params.id;

    const authz = await requireBrandAccess(supabase, brandId);
    if (!authz.ok) return authz.response;

    const { data: brand, error } = await supabase
      .from("brands")
      .select(BRAND_SELECT_FIELDS)
      .eq("id", brandId)
      .single();

    if (error) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json({ brand });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const brandId = params.id;

    const authz = await requireBrandAccess(supabase, brandId);
    if (!authz.ok) return authz.response;

    // Get the update data
    const updateData = await request.json().catch(() => null);
    if (!updateData || typeof updateData !== "object" || Array.isArray(updateData)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const updateKeys = Object.keys(updateData);
    const invalidKeys = updateKeys.filter((key) => !ALLOWED_UPDATE_FIELDS.has(key));
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { error: "Request contains unsupported fields" },
        { status: 400 }
      );
    }

    // Validate brand name length if it's being updated
    if (typeof updateData.name === "string" && updateData.name.length > 50) {
      return NextResponse.json(
        { error: "Brand name must be 50 characters or less" },
        { status: 400 }
      );
    }

    // Validate description length if it's being updated
    if (
      typeof updateData.description === "string" &&
      updateData.description.length > 150
    ) {
      return NextResponse.json(
        { error: "Brand description must be 150 characters or less" },
        { status: 400 }
      );
    }

    if (
      updateData.categories !== undefined &&
      !(
        Array.isArray(updateData.categories) &&
        updateData.categories.every((item: unknown) => typeof item === "string")
      )
    ) {
      return NextResponse.json(
        { error: "Categories must be an array of strings" },
        { status: 400 }
      );
    }

    // Get the current brand data to check if name or currency is changing
    const { data: currentBrand, error: fetchError } = await supabase
      .from("brands")
      .select("name, currency")
      .eq("id", brandId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const isNameChanging =
      updateData.name && updateData.name !== currentBrand.name;

    // Filter out undefined/null values to avoid overwriting with null
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(
        ([_, value]) => value !== undefined && value !== null
      )
    );

    const { data: updatedBrand, error: updateError } = await supabase
      .from("brands")
      .update({
        ...cleanUpdateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", brandId)
      .select(BRAND_SELECT_FIELDS)
      .single();

    if (updateError) {
      console.error("❌ Error updating brand:", updateError.code);
      return NextResponse.json(
        { error: "Failed to update brand" },
        { status: 500 }
      );
    }

    // If an image was updated, also update the brand_images table
    if (updateData.image) {
      try {
        // Extract storage path from the image URL
        const imageUrl = updateData.image;
        let storagePath = imageUrl;

        // If it's a full Supabase URL, extract just the path
        if (imageUrl.includes("/storage/v1/object/public/brand-assets/")) {
          storagePath = imageUrl.split(
            "/storage/v1/object/public/brand-assets/"
          )[1];
        }

        // First, delete any existing brand_images entries for this brand
        const { error: deleteError } = await supabase
          .from("brand_images")
          .delete()
          .eq("brand_id", brandId);

        if (deleteError) {
          console.warn(
            "⚠️ Warning: Failed to delete existing brand_images:",
            deleteError
          );
        }

        // Then insert the new entry
        const { data: newBrandImage, error: insertError } = await supabase
          .from("brand_images")
          .insert({
            brand_id: brandId,
            role: "cover",
            storage_path: storagePath,
          })
          .select()
          .single();

        if (insertError) {
          console.warn(
            "⚠️ Warning: Failed to insert new brand_image:",
            insertError
          );
        }
      } catch (imageSyncError) {
        console.warn("⚠️ Warning: Image sync failed:", imageSyncError);
        // Don't fail the entire operation for this
      }
    }

    // If the brand currency changed, sync product currencies
    if (updateData.currency && updateData.currency !== currentBrand.currency) {
      try {
        const syncResult = await syncProductCurrencies(
          brandId,
          updateData.currency
        );
        if (!syncResult.success) {
          console.warn(
            `⚠️ Warning: Product currency sync failed: ${syncResult.error}`
          );
          // Don't fail the entire operation for this
        }
      } catch (syncError) {
        console.warn("⚠️ Warning: Product currency sync failed:", syncError);
        // Don't fail the entire operation for this
      }
    }

    // If the brand name changed, update related tables
    if (isNameChanging) {
      // Update spotlight content that references this brand by name
      const { error: spotlightError } = await supabase
        .from("spotlight_content")
        .update({ brand_name: updateData.name })
        .eq("brand_name", currentBrand.name);

      if (spotlightError) {
        console.warn("⚠️ Error updating spotlight content:", spotlightError);
        // Don't fail the entire operation for this
      }
    }

    // Clear the brands cache to ensure fresh data after update
    try {
      clearBrandsCache();
    } catch (cacheError) {
      console.warn("⚠️ Warning: Failed to clear brands cache:", cacheError);
      // Don't fail the entire operation for this
    }

    return NextResponse.json({
      success: true,
      brand: updatedBrand,
      nameChanged: isNameChanging,
    });
  } catch (error) {
    console.error("❌ Brand update API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
