import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import setupStorage from "@/lib/supabase-storage-setup";

// Flag to check if we're in build process
const isBuildTime =
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE === "phase-production-build";

export async function GET(request: NextRequest) {
  // During build time, just return a dummy response
  if (isBuildTime) {
    console.log("Running in build process - skipping actual image repair");
    return NextResponse.json({
      success: true,
      message: "Build-time dummy response - actual repair runs at runtime",
      result: { brands: 0, collections: 0, products: 0, profiles: 0, total: 0 },
    });
  }

  try {
    // Setup storage to ensure buckets exist
    try {
      await setupStorage();
    } catch (storageError) {
      console.warn(
        "Storage setup failed, but continuing with image repair:",
        storageError
      );
    }

    console.log("Starting image URL repair...");

    let result = {
      brands: 0,
      collections: 0,
      products: 0,
      profiles: 0,
      total: 0,
    };

    // Process brands
    try {
      const { data: brands, error: brandsError } = await supabase
        .from("brands")
        .select("id, image");

      if (brandsError) {
        console.warn(`Error fetching brands: ${brandsError.message}`);
      } else {
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
        result.brands = brandFixCount;
      }
    } catch (brandsError) {
      console.warn("Error processing brands:", brandsError);
    }

    // Process collections
    try {
      const { data: collections, error: collectionsError } = await supabase
        .from("collections")
        .select("id, image");

      if (collectionsError) {
        console.warn(`Error fetching collections: ${collectionsError.message}`);
      } else {
        let collectionFixCount = 0;
        for (const collection of collections || []) {
          if (
            collection.image &&
            collection.image.includes("/lovable-uploads/")
          ) {
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
        result.collections = collectionFixCount;
      }
    } catch (collectionsError) {
      console.warn("Error processing collections:", collectionsError);
    }

    // Process products
    try {
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, image");

      if (productsError) {
        console.warn(`Error fetching products: ${productsError.message}`);
      } else {
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
        result.products = productFixCount;
      }
    } catch (productsError) {
      console.warn("Error processing products:", productsError);
    }

    // Process profiles
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, avatar_url");

      if (profilesError) {
        console.warn(`Error fetching profiles: ${profilesError.message}`);
      } else {
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
        result.profiles = profileFixCount;
      }
    } catch (profilesError) {
      console.warn("Error processing profiles:", profilesError);
    }

    result.total =
      result.brands + result.collections + result.products + result.profiles;
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
