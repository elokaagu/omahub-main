import { supabase, safeDbOperation } from "../supabase";
import { Brand, Collection, Product, Profile } from "../supabase";

// Improved build time detection
const isBuildTime =
  process.env.NODE_ENV === "production" &&
  (process.env.NEXT_PHASE === "phase-production-build" ||
    (process.env.VERCEL_ENV === "production" &&
      process.env.VERCEL_BUILD_STEP === "true"));

/**
 * This script migrates the old image URLs to the correct Supabase storage format
 * It's needed because some image URLs in the database are using an incorrect format
 */
export async function migrateImageUrls() {
  // Skip actual migration during build time
  if (isBuildTime) {
    console.log(
      "Running in build process - skipping actual image URL migration"
    );
    return {
      brands: 0,
      collections: 0,
      products: 0,
      profiles: 0,
      total: 0,
    };
  }

  console.log("Starting image URL migration...");

  let result = {
    brands: 0,
    collections: 0,
    products: 0,
    profiles: 0,
    total: 0,
  };

  try {
    // 1. Fix brand images
    try {
      const brands = await supabase.from("brands").select("id, image");

      if (brands.error) {
        console.warn("Error fetching brands:", brands.error);
      } else if (brands.data && brands.data.length > 0) {
        console.log(`Found ${brands.data.length} brands to check`);

        let brandUpdatesCount = 0;
        for (const brand of brands.data) {
          if (brand.image && brand.image.includes("/lovable-uploads/")) {
            // Extract the filename from the old URL
            const filename = brand.image.split("/").pop();

            if (!filename) continue;

            // Create a new URL in the correct format
            const newImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/brands/${filename}`;

            // Update the brand record
            const updateResult = await supabase
              .from("brands")
              .update({ image: newImageUrl })
              .eq("id", brand.id);

            if (updateResult.error) {
              console.warn(
                `Error updating brand ${brand.id}:`,
                updateResult.error
              );
            } else {
              brandUpdatesCount++;
            }
          }
        }

        console.log(`Updated ${brandUpdatesCount} brand image URLs`);
        result.brands = brandUpdatesCount;
      }
    } catch (brandsError) {
      console.warn("Error processing brands:", brandsError);
    }

    // 2. Fix collection images
    try {
      const collections = await supabase
        .from("collections")
        .select("id, image");

      if (collections.error) {
        console.warn("Error fetching collections:", collections.error);
      } else if (collections.data && collections.data.length > 0) {
        console.log(`Found ${collections.data.length} collections to check`);

        let collectionUpdatesCount = 0;
        for (const collection of collections.data) {
          if (
            collection.image &&
            collection.image.includes("/lovable-uploads/")
          ) {
            // Extract the filename from the old URL
            const filename = collection.image.split("/").pop();

            if (!filename) continue;

            // Create a new URL in the correct format
            const newImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/collections/${filename}`;

            // Update the collection record
            const updateResult = await supabase
              .from("collections")
              .update({ image: newImageUrl })
              .eq("id", collection.id);

            if (updateResult.error) {
              console.warn(
                `Error updating collection ${collection.id}:`,
                updateResult.error
              );
            } else {
              collectionUpdatesCount++;
            }
          }
        }

        console.log(`Updated ${collectionUpdatesCount} collection image URLs`);
        result.collections = collectionUpdatesCount;
      }
    } catch (collectionsError) {
      console.warn("Error processing collections:", collectionsError);
    }

    // 3. Fix product images
    try {
      const products = await supabase.from("products").select("id, image");

      if (products.error) {
        console.warn("Error fetching products:", products.error);
      } else if (products.data && products.data.length > 0) {
        console.log(`Found ${products.data.length} products to check`);

        let productUpdatesCount = 0;
        for (const product of products.data) {
          if (product.image && product.image.includes("/lovable-uploads/")) {
            // Extract the filename from the old URL
            const filename = product.image.split("/").pop();

            if (!filename) continue;

            // Create a new URL in the correct format
            const newImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/products/${filename}`;

            // Update the product record
            const updateResult = await supabase
              .from("products")
              .update({ image: newImageUrl })
              .eq("id", product.id);

            if (updateResult.error) {
              console.warn(
                `Error updating product ${product.id}:`,
                updateResult.error
              );
            } else {
              productUpdatesCount++;
            }
          }
        }

        console.log(`Updated ${productUpdatesCount} product image URLs`);
        result.products = productUpdatesCount;
      }
    } catch (productsError) {
      console.warn("Error processing products:", productsError);
    }

    // 4. Fix profile images
    try {
      const profiles = await supabase.from("profiles").select("id, avatar_url");

      if (profiles.error) {
        console.warn("Error fetching profiles:", profiles.error);
      } else if (profiles.data && profiles.data.length > 0) {
        console.log(`Found ${profiles.data.length} profiles to check`);

        let profileUpdatesCount = 0;
        for (const profile of profiles.data) {
          if (
            profile.avatar_url &&
            profile.avatar_url.includes("/lovable-uploads/")
          ) {
            // Extract the filename from the old URL
            const filename = profile.avatar_url.split("/").pop();

            if (!filename) continue;

            // Create a new URL in the correct format
            const newImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profiles/avatars/${filename}`;

            // Update the profile record
            const updateResult = await supabase
              .from("profiles")
              .update({ avatar_url: newImageUrl })
              .eq("id", profile.id);

            if (updateResult.error) {
              console.warn(
                `Error updating profile ${profile.id}:`,
                updateResult.error
              );
            } else {
              profileUpdatesCount++;
            }
          }
        }

        console.log(`Updated ${profileUpdatesCount} profile image URLs`);
        result.profiles = profileUpdatesCount;
      }
    } catch (profilesError) {
      console.warn("Error processing profiles:", profilesError);
    }

    result.total =
      result.brands + result.collections + result.products + result.profiles;
    console.log("Image URL migration completed successfully");
    return result;
  } catch (error) {
    console.error("Error during image URL migration:", error);
    return result; // Return the partial results instead of throwing
  }
}

export default migrateImageUrls;
