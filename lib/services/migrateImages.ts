import { supabase } from "../supabase";

// Flag to check if we're in build process
const isBuildTime =
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE === "phase-production-build";

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
      const { data: brands, error: brandsError } = await supabase
        .from("brands")
        .select("id, image");

      if (brandsError) {
        console.warn("Error fetching brands:", brandsError);
      } else {
        console.log(`Found ${brands.length} brands to check`);

        let brandUpdatesCount = 0;
        for (const brand of brands) {
          if (brand.image && brand.image.includes("/lovable-uploads/")) {
            // Extract the filename from the old URL
            const filename = brand.image.split("/").pop();

            if (!filename) continue;

            // Create a new URL in the correct format
            const newImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/brands/${filename}`;

            // Update the brand record
            const { error } = await supabase
              .from("brands")
              .update({ image: newImageUrl })
              .eq("id", brand.id);

            if (error) {
              console.warn(`Error updating brand ${brand.id}:`, error);
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
      const { data: collections, error: collectionsError } = await supabase
        .from("collections")
        .select("id, image");

      if (collectionsError) {
        console.warn("Error fetching collections:", collectionsError);
      } else {
        console.log(`Found ${collections.length} collections to check`);

        let collectionUpdatesCount = 0;
        for (const collection of collections) {
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
            const { error } = await supabase
              .from("collections")
              .update({ image: newImageUrl })
              .eq("id", collection.id);

            if (error) {
              console.warn(
                `Error updating collection ${collection.id}:`,
                error
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
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, image");

      if (productsError) {
        console.warn("Error fetching products:", productsError);
      } else {
        console.log(`Found ${products.length} products to check`);

        let productUpdatesCount = 0;
        for (const product of products) {
          if (product.image && product.image.includes("/lovable-uploads/")) {
            // Extract the filename from the old URL
            const filename = product.image.split("/").pop();

            if (!filename) continue;

            // Create a new URL in the correct format
            const newImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/products/${filename}`;

            // Update the product record
            const { error } = await supabase
              .from("products")
              .update({ image: newImageUrl })
              .eq("id", product.id);

            if (error) {
              console.warn(`Error updating product ${product.id}:`, error);
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
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, avatar_url");

      if (profilesError) {
        console.warn("Error fetching profiles:", profilesError);
      } else {
        console.log(`Found ${profiles.length} profiles to check`);

        let profileUpdatesCount = 0;
        for (const profile of profiles) {
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
            const { error } = await supabase
              .from("profiles")
              .update({ avatar_url: newImageUrl })
              .eq("id", profile.id);

            if (error) {
              console.warn(`Error updating profile ${profile.id}:`, error);
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
