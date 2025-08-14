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

async function recoverOriginalImages() {
  try {
    console.log("🔄 Attempting to recover original images...");

    // Step 1: Check what's in your storage buckets
    console.log("\n📦 Checking storage buckets...");
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error("❌ Error listing buckets:", bucketsError);
      return;
    }

    console.log("Available buckets:", buckets.map((b) => b.name).join(", "));

    // Step 2: Check brand-assets bucket for original images
    console.log("\n🔍 Checking brand-assets bucket...");
    const { data: brandAssetsFiles, error: brandAssetsError } =
      await supabase.storage.from("brand-assets").list("", { limit: 1000 });

    if (brandAssetsError) {
      console.error("❌ Error listing brand-assets:", brandAssetsError);
      return;
    }

    console.log(
      `Found ${brandAssetsFiles.length} files in brand-assets bucket`
    );

    // Show all files
    brandAssetsFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.name}`);
      if (file.metadata) {
        console.log(`     Size: ${file.metadata.size} bytes`);
        console.log(`     MIME: ${file.metadata.mimetype}`);
      }
    });

    // Step 3: Check if there are any original image files
    const imageFiles = brandAssetsFiles.filter(
      (file) =>
        file.name &&
        (file.name.includes(".jpg") ||
          file.name.includes(".jpeg") ||
          file.name.includes(".png") ||
          file.name.includes(".webp"))
    );

    console.log(`\n📸 Found ${imageFiles.length} image files`);

    if (imageFiles.length === 0) {
      console.log(
        "❌ No image files found in storage. Your original images may have been deleted."
      );
      console.log("💡 You may need to re-upload your brand images.");
      return;
    }

    // Step 4: Try to match images to brands
    console.log("\n🔗 Attempting to match images to brands...");

    // Get current brands
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    // Try to find matching images for each brand
    let recoveredCount = 0;
    for (const brand of brands) {
      console.log(`\n🔍 Looking for images for: ${brand.name}`);

      // Try to find images that might match this brand
      const matchingImages = imageFiles.filter((file) => {
        const fileName = file.name.toLowerCase();
        const brandName = brand.name.toLowerCase();

        // Check if brand name appears in filename
        return (
          fileName.includes(brandName.replace(/\s+/g, "")) ||
          fileName.includes(brandName.replace(/\s+/g, "_")) ||
          fileName.includes(brandName.replace(/\s+/g, "-"))
        );
      });

      if (matchingImages.length > 0) {
        console.log(`   ✅ Found ${matchingImages.length} potential matches:`);
        matchingImages.forEach((img) => console.log(`      - ${img.name}`));

        // Use the first matching image
        const bestMatch = matchingImages[0];
        const newImageUrl = `${supabaseUrl}/storage/v1/object/public/brand-assets/${bestMatch.name}`;

        console.log(`   🔄 Updating brand with: ${newImageUrl}`);

        // Update the brand
        const { error: updateError } = await supabase
          .from("brands")
          .update({ image: newImageUrl })
          .eq("id", brand.id);

        if (updateError) {
          console.log(`   ❌ Failed to update: ${updateError.message}`);
        } else {
          console.log(`   ✅ Successfully recovered image for ${brand.name}`);
          recoveredCount++;
        }
      } else {
        console.log(`   ❌ No matching images found`);
      }
    }

    console.log(`\n🎉 Recovery completed!`);
    console.log(
      `✅ Recovered ${recoveredCount} out of ${brands.length} brands`
    );

    if (recoveredCount === 0) {
      console.log("\n💡 No images could be automatically recovered.");
      console.log("🔧 You may need to:");
      console.log(
        "   1. Check if your original images are in a different storage bucket"
      );
      console.log("   2. Re-upload your brand images manually");
      console.log("   3. Check if there's a backup of your database");
    }
  } catch (error) {
    console.error("❌ Error in recoverOriginalImages:", error);
  }
}

// Run the recovery
recoverOriginalImages()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
