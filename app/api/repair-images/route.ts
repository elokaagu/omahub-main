import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import setupStorage from "@/lib/supabase-storage-setup";

export async function GET(request: NextRequest) {
  try {
    // Setup storage to ensure buckets exist
    await setupStorage();

    console.log("Starting image URL repair...");

    // Process brands
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, image");

    if (brandsError) {
      throw new Error(`Error fetching brands: ${brandsError.message}`);
    }

    let brandFixCount = 0;
    for (const brand of brands || []) {
      if (brand.image && brand.image.includes("/lovable-uploads/")) {
        // Get file name from URL
        const fileName = brand.image.split("/").pop();
        if (!fileName) continue;

        // Create proper Supabase URL
        const newUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/brands/${fileName}`;

        // Update the record
        const { error: updateError } = await supabase
          .from("brands")
          .update({ image: newUrl })
          .eq("id", brand.id);

        if (!updateError) brandFixCount++;
      }
    }

    // Process collections
    const { data: collections, error: collectionsError } = await supabase
      .from("collections")
      .select("id, image");

    if (collectionsError) {
      throw new Error(
        `Error fetching collections: ${collectionsError.message}`
      );
    }

    let collectionFixCount = 0;
    for (const collection of collections || []) {
      if (collection.image && collection.image.includes("/lovable-uploads/")) {
        // Get file name from URL
        const fileName = collection.image.split("/").pop();
        if (!fileName) continue;

        // Create proper Supabase URL
        const newUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/collections/${fileName}`;

        // Update the record
        const { error: updateError } = await supabase
          .from("collections")
          .update({ image: newUrl })
          .eq("id", collection.id);

        if (!updateError) collectionFixCount++;
      }
    }

    // Process products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, image");

    if (productsError) {
      throw new Error(`Error fetching products: ${productsError.message}`);
    }

    let productFixCount = 0;
    for (const product of products || []) {
      if (product.image && product.image.includes("/lovable-uploads/")) {
        // Get file name from URL
        const fileName = product.image.split("/").pop();
        if (!fileName) continue;

        // Create proper Supabase URL
        const newUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/products/${fileName}`;

        // Update the record
        const { error: updateError } = await supabase
          .from("products")
          .update({ image: newUrl })
          .eq("id", product.id);

        if (!updateError) productFixCount++;
      }
    }

    // Process profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, avatar_url");

    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`);
    }

    let profileFixCount = 0;
    for (const profile of profiles || []) {
      if (
        profile.avatar_url &&
        profile.avatar_url.includes("/lovable-uploads/")
      ) {
        // Get file name from URL
        const fileName = profile.avatar_url.split("/").pop();
        if (!fileName) continue;

        // Create proper Supabase URL
        const newUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profiles/avatars/${fileName}`;

        // Update the record
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_url: newUrl })
          .eq("id", profile.id);

        if (!updateError) profileFixCount++;
      }
    }

    const result = {
      brands: brandFixCount,
      collections: collectionFixCount,
      products: productFixCount,
      profiles: profileFixCount,
      total:
        brandFixCount + collectionFixCount + productFixCount + profileFixCount,
    };

    console.log("Image repair completed:", result);

    return NextResponse.json({
      success: true,
      message: "Image URLs repaired successfully",
      result,
    });
  } catch (error) {
    console.error("Error repairing images:", error);
    return NextResponse.json(
      {
        error: "Image repair failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
