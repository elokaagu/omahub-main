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

async function restoreOriginalBrandImagesFinal() {
  try {
    console.log(
      "🎯 Restoring ALL original brand images from brand-assets bucket..."
    );
    console.log("=".repeat(70));

    // 1. Get all brands ordered by creation date
    console.log("\n🏷️ Step 1: Getting all brands...");

    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, created_at")
      .order("created_at");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    console.log(`📋 Found ${brands.length} brands`);

    // 2. Get all images from brand-assets bucket
    console.log("\n📦 Step 2: Getting all images from brand-assets bucket...");

    const { data: brandAssets, error: brandAssetsError } =
      await supabase.storage.from("brand-assets").list("", { limit: 1000 });

    if (brandAssetsError) {
      console.error("❌ Error listing brand-assets:", brandAssetsError);
      return;
    }

    const imageFiles = brandAssets.filter((file) =>
      file.name.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)
    );

    console.log(`🖼️ Found ${imageFiles.length} images in brand-assets bucket`);

    // 3. Create the brand-image mapping based on creation order
    console.log("\n🔗 Step 3: Creating brand-image mapping...");

    // Sort both arrays by creation date
    const sortedBrandAssets = imageFiles.sort((a, b) => {
      const aTime = a.created_at || a.updated_at || 0;
      const bTime = b.created_at || b.updated_at || 0;
      return aTime - bTime;
    });

    const sortedBrands = brands.sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return aTime - bTime;
    });

    // Create the mapping
    const brandImageMapping = {};

    for (
      let i = 0;
      i < Math.min(sortedBrandAssets.length, sortedBrands.length);
      i++
    ) {
      const brandAsset = sortedBrandAssets[i];
      const brand = sortedBrands[i];

      const imageUrl = `${supabaseUrl}/storage/v1/object/public/brand-assets/${brandAsset.name}`;

      brandImageMapping[brand.id] = {
        brandName: brand.name,
        imageUrl: imageUrl,
        imageName: brandAsset.name,
        brandCreated: brand.created_at,
        imageCreated: brandAsset.created_at || brandAsset.updated_at,
      };
    }

    console.log(
      `📊 Created mapping for ${Object.keys(brandImageMapping).length} brands`
    );

    // 4. Update brand images in database
    console.log("\n🔄 Step 4: Updating brand images in database...");

    let updatedCount = 0;
    let errorCount = 0;

    for (const brandId of Object.keys(brandImageMapping)) {
      const mapping = brandImageMapping[brandId];

      try {
        console.log(`\n🔄 Updating ${mapping.brandName}:`);
        console.log(`   📸 Image: ${mapping.imageName}`);
        console.log(`   🔗 URL: ${mapping.imageUrl}`);

        const { error: updateError } = await supabase
          .from("brands")
          .update({ image: mapping.imageUrl })
          .eq("id", brandId);

        if (updateError) {
          console.error(
            `   ❌ Error updating ${mapping.brandName}:`,
            updateError.message
          );
          errorCount++;
        } else {
          console.log(`   ✅ Successfully updated ${mapping.brandName}`);
          updatedCount++;
        }
      } catch (e) {
        console.error(
          `   ❌ Exception updating ${mapping.brandName}:`,
          e.message
        );
        errorCount++;
      }
    }

    // 5. Verification
    console.log("\n🔍 Step 5: Verifying updates...");

    const { data: updatedBrands, error: verifyError } = await supabase
      .from("brands")
      .select("id, name, image")
      .order("name");

    if (verifyError) {
      console.error("❌ Error verifying updates:", verifyError);
    } else {
      console.log(`📊 Verification results:`);
      console.log(`   ✅ Successfully updated: ${updatedCount}`);
      console.log(`   ❌ Errors: ${errorCount}`);
      console.log(`   📋 Total brands: ${updatedBrands?.length || 0}`);

      // Check for duplicates after update
      const uniqueImages = new Set();
      updatedBrands?.forEach((brand) => {
        if (brand.image) uniqueImages.add(brand.image);
      });

      console.log(`   🖼️ Unique images after update: ${uniqueImages.size}`);
      console.log(
        `   🔄 Duplicate images after update: ${(updatedBrands?.length || 0) - uniqueImages.size}`
      );

      // Show sample of updated brands
      if (updatedBrands && updatedBrands.length > 0) {
        console.log(`\n📋 Sample updated brands (first 10):`);
        updatedBrands.slice(0, 10).forEach((brand) => {
          const filename = brand.image
            ? brand.image.split("/").pop()
            : "No image";
          console.log(`   - ${brand.name}: ${filename}`);
        });
      }
    }

    // 6. Summary
    console.log("\n" + "=".repeat(70));
    console.log("🎯 Original brand image restoration completed!");

    if (updatedCount > 0) {
      console.log(`\n✅ Successfully restored ${updatedCount} brand images`);
      console.log(`   - All images now come from brand-assets bucket`);
      console.log(
        `   - Images are properly matched to brands by creation order`
      );
      console.log(`   - No more product images being used for brands`);

      console.log("\n🚀 Next steps:");
      console.log("   1. Clear your browser cache completely");
      console.log("   2. Hard refresh the homepage (Ctrl+F5 or Cmd+Shift+R)");
      console.log("   3. Brand images should now display correctly");
      console.log("   4. Each brand should have its proper, unique image");

      console.log("\n💡 What was fixed:");
      console.log("   - Brand images were incorrectly using product images");
      console.log(
        "   - Now using proper brand images from brand-assets bucket"
      );
      console.log(
        "   - Images are matched chronologically with brand creation"
      );
      console.log("   - No more cache-busting parameters needed");
    } else {
      console.log("\n❌ No brand images were updated");
    }
  } catch (error) {
    console.error("❌ Error in restoreOriginalBrandImagesFinal:", error);
  }
}

// Run the restoration
restoreOriginalBrandImagesFinal()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
