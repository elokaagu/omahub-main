import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import setupStorage from "@/lib/supabase-storage-setup";

// Improved build time detection with multiple checks
const isBuildTime =
  process.env.NODE_ENV === "production" &&
  (process.env.NEXT_PHASE === "phase-production-build" ||
    (process.env.VERCEL_ENV === "production" &&
      process.env.VERCEL_BUILD_STEP === "true"));

// Mark this route as server-side only
export const dynamic = "force-dynamic";
// Disable static generation for this route
export const fetchCache = "force-no-store";
export const revalidate = 0;

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
      const brands = await supabase.from("brands").select("id, image");

      if (brands.error) {
        console.warn(`Error fetching brands: ${brands.error.message}`);
      } else if (brands.data && brands.data.length > 0) {
        let brandFixCount = 0;
        for (const brand of brands.data) {
          if (brand.image && brand.image.includes("/lovable-uploads/")) {
            // Get file name from URL
            const fileName = brand.image.split("/").pop();
            if (!fileName) continue;

            // Create proper Supabase URL
            const newUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/brands/${fileName}`;

            // Update the record
            const updateResult = await supabase
              .from("brands")
              .update({ image: newUrl })
              .eq("id", brand.id);

            if (!updateResult.error) brandFixCount++;
          }
        }
        result.brands = brandFixCount;
      }
    } catch (brandsError) {
      console.warn("Error processing brands:", brandsError);
    }

    // Process collections
    try {
      const collections = await supabase
        .from("collections")
        .select("id, image");

      if (collections.error) {
        console.warn(
          `Error fetching collections: ${collections.error.message}`
        );
      } else if (collections.data && collections.data.length > 0) {
        let collectionFixCount = 0;
        for (const collection of collections.data) {
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
            const updateResult = await supabase
              .from("collections")
              .update({ image: newUrl })
              .eq("id", collection.id);

            if (!updateResult.error) collectionFixCount++;
          }
        }
        result.collections = collectionFixCount;
      }
    } catch (collectionsError) {
      console.warn("Error processing collections:", collectionsError);
    }

    // Process products
    try {
      const products = await supabase.from("products").select("id, image");

      if (products.error) {
        console.warn(`Error fetching products: ${products.error.message}`);
      } else if (products.data && products.data.length > 0) {
        let productFixCount = 0;
        for (const product of products.data) {
          if (product.image && product.image.includes("/lovable-uploads/")) {
            // Get file name from URL
            const fileName = product.image.split("/").pop();
            if (!fileName) continue;

            // Create proper Supabase URL
            const newUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/products/${fileName}`;

            // Update the record
            const updateResult = await supabase
              .from("products")
              .update({ image: newUrl })
              .eq("id", product.id);

            if (!updateResult.error) productFixCount++;
          }
        }
        result.products = productFixCount;
      }
    } catch (productsError) {
      console.warn("Error processing products:", productsError);
    }

    // Process profiles
    try {
      const profiles = await supabase.from("profiles").select("id, avatar_url");

      if (profiles.error) {
        console.warn(`Error fetching profiles: ${profiles.error.message}`);
      } else if (profiles.data && profiles.data.length > 0) {
        let profileFixCount = 0;
        for (const profile of profiles.data) {
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
            const updateResult = await supabase
              .from("profiles")
              .update({ avatar_url: newUrl })
              .eq("id", profile.id);

            if (!updateResult.error) profileFixCount++;
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
