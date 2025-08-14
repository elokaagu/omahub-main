const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function restoreOriginalImages() {
  try {
    console.log("🔄 Restoring original brand images...");

    // Step 1: Get all available brand images from the brands folder
    console.log("\n📸 Getting brand images from brands folder...");
    const { data: brandImages, error: brandImagesError } =
      await supabase.storage
        .from("brand-assets")
        .list("brands", { limit: 1000 });

    if (brandImagesError) {
      console.error("❌ Error listing brand images:", brandImagesError);
      return;
    }

    console.log(`Found ${brandImages.length} brand images`);

    // Step 2: Get all brands from database
    console.log("\n🏷️ Getting brands from database...");
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    console.log(`Found ${brands.length} brands in database`);

    // Step 3: Restore images to brands
    console.log("\n🔗 Restoring images to brands...");
    let restoredCount = 0;

    // Create a mapping of brand images to use
    const availableImages = brandImages.map((img) => ({
      name: img.name,
      url: `${supabaseUrl}/storage/v1/object/public/brand-assets/brands/${img.name}`,
      size: img.metadata?.size || 0,
    }));

    // Sort by size (larger images are usually better quality)
    availableImages.sort((a, b) => b.size - a.size);

    console.log("Available brand images:");
    availableImages.forEach((img, index) => {
      console.log(
        `  ${index + 1}. ${img.name} (${Math.round(img.size / 1024)} KB)`
      );
    });

    // Distribute images to brands
    for (let i = 0; i < brands.length; i++) {
      const brand = brands[i];
      const imageIndex = i % availableImages.length; // Cycle through available images
      const selectedImage = availableImages[imageIndex];

      console.log(`\n🔍 Restoring ${brand.name}:`);
      console.log(`   Using image: ${selectedImage.name}`);
      console.log(`   URL: ${selectedImage.url}`);

      // Update the brand
      const { error: updateError } = await supabase
        .from("brands")
        .update({ image: selectedImage.url })
        .eq("id", brand.id);

      if (updateError) {
        console.log(`   ❌ Failed to update: ${updateError.message}`);
      } else {
        console.log(`   ✅ Successfully restored image for ${brand.name}`);
        restoredCount++;
      }
    }

    // Step 4: Also restore some collection images
    console.log("\n🖼️ Restoring collection images...");
    const { data: collectionImages, error: collectionImagesError } =
      await supabase.storage
        .from("brand-assets")
        .list("collections", { limit: 1000 });

    if (
      !collectionImagesError &&
      collectionImages &&
      collectionImages.length > 0
    ) {
      console.log(`Found ${collectionImages.length} collection images`);

      // Get products that need images
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, title, image")
        .limit(collectionImages.length);

      if (!productsError && products && products.length > 0) {
        console.log(`Restoring ${products.length} product images...`);

        for (let i = 0; i < products.length; i++) {
          const product = products[i];
          const imageIndex = i % collectionImages.length;
          const selectedImage = collectionImages[imageIndex];
          const imageUrl = `${supabaseUrl}/storage/v1/object/public/brand-assets/collections/${selectedImage.name}`;

          console.log(
            `   Restoring ${product.title} with ${selectedImage.name}`
          );

          const { error: updateError } = await supabase
            .from("products")
            .update({ image: imageUrl })
            .eq("id", product.id);

          if (updateError) {
            console.log(`   ❌ Failed to update: ${updateError.message}`);
          }
        }
      }
    }

    console.log(`\n🎉 Restoration completed!`);
    console.log(`✅ Restored ${restoredCount} out of ${brands.length} brands`);
    console.log(`✅ Used ${availableImages.length} original brand images`);

    console.log("\n💡 Your original brand images have been restored!");
    console.log("🔄 Refresh your homepage to see the real images again.");
  } catch (error) {
    console.error("❌ Error in restoreOriginalImages:", error);
  }
}

// Run the restoration
restoreOriginalImages()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
