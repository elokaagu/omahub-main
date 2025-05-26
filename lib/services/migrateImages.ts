import { supabase } from "../supabase";

/**
 * This script migrates the old image URLs to the correct Supabase storage format
 * It's needed because some image URLs in the database are using an incorrect format
 */
export async function migrateImageUrls() {
  console.log("Starting image URL migration...");

  try {
    // 1. Fix brand images
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, image");

    if (brandsError) {
      console.error("Error fetching brands:", brandsError);
      return;
    }

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
          console.error(`Error updating brand ${brand.id}:`, error);
        } else {
          brandUpdatesCount++;
        }
      }
    }

    console.log(`Updated ${brandUpdatesCount} brand image URLs`);

    // 2. Fix collection images
    const { data: collections, error: collectionsError } = await supabase
      .from("collections")
      .select("id, image");

    if (collectionsError) {
      console.error("Error fetching collections:", collectionsError);
      return;
    }

    console.log(`Found ${collections.length} collections to check`);

    let collectionUpdatesCount = 0;
    for (const collection of collections) {
      if (collection.image && collection.image.includes("/lovable-uploads/")) {
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
          console.error(`Error updating collection ${collection.id}:`, error);
        } else {
          collectionUpdatesCount++;
        }
      }
    }

    console.log(`Updated ${collectionUpdatesCount} collection image URLs`);

    // 3. Fix product images
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, image");

    if (productsError) {
      console.error("Error fetching products:", productsError);
      return;
    }

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
          console.error(`Error updating product ${product.id}:`, error);
        } else {
          productUpdatesCount++;
        }
      }
    }

    console.log(`Updated ${productUpdatesCount} product image URLs`);

    // 4. Fix profile images
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, avatar_url");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return;
    }

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
          console.error(`Error updating profile ${profile.id}:`, error);
        } else {
          profileUpdatesCount++;
        }
      }
    }

    console.log(`Updated ${profileUpdatesCount} profile image URLs`);

    console.log("Image URL migration completed successfully");
    return {
      brands: brandUpdatesCount,
      collections: collectionUpdatesCount,
      products: productUpdatesCount,
      profiles: profileUpdatesCount,
      total:
        brandUpdatesCount +
        collectionUpdatesCount +
        productUpdatesCount +
        profileUpdatesCount,
    };
  } catch (error) {
    console.error("Error during image URL migration:", error);
    throw error;
  }
}

export default migrateImageUrls;
