const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
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

async function updateBrandImagesFromMapping() {
  try {
    console.log("🎯 Updating Brand Images from Manual Mapping");
    console.log("=".repeat(70));

    // 1. Check if mapping file exists
    const mappingFile = "brand-image-mapping.json";

    if (!fs.existsSync(mappingFile)) {
      console.error(`❌ Mapping file '${mappingFile}' not found!`);
      console.log("\n💡 You need to:");
      console.log(
        "   1. Edit the template file: 'brand-image-mapping-template.json'"
      );
      console.log("   2. Save it as 'brand-image-mapping.json'");
      console.log("   3. Run this script again");
      return;
    }

    console.log(`✅ Found mapping file: ${mappingFile}`);

    // 2. Read and parse the mapping file
    console.log("\n📖 Step 1: Reading mapping file...");

    let mapping;
    try {
      const mappingContent = fs.readFileSync(mappingFile, "utf8");
      mapping = JSON.parse(mappingContent);
    } catch (parseError) {
      console.error("❌ Error parsing mapping file:", parseError.message);
      console.log("   Make sure the file contains valid JSON");
      return;
    }

    const brandNames = Object.keys(mapping);
    console.log(`📋 Found ${brandNames.length} brand-image mappings`);

    // 3. Validate the mapping
    console.log("\n🔍 Step 2: Validating mapping...");

    const validationErrors = [];

    brandNames.forEach((brandName) => {
      const imageFilename = mapping[brandName];

      if (!imageFilename || imageFilename === "NO_IMAGE") {
        validationErrors.push(`${brandName}: No image specified`);
      }

      if (typeof imageFilename !== "string") {
        validationErrors.push(`${brandName}: Invalid image filename type`);
      }
    });

    if (validationErrors.length > 0) {
      console.error("❌ Validation errors found:");
      validationErrors.forEach((error) => console.error(`   - ${error}`));
      console.log("\n💡 Fix these errors in your mapping file and try again");
      return;
    }

    console.log("✅ Mapping validation passed");

    // 4. Get all brands from database
    console.log("\n🏷️ Step 3: Getting brands from database...");

    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image")
      .order("name");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    console.log(`📋 Found ${brands.length} brands in database`);

    // 5. Create brand ID mapping
    const brandIdMap = {};
    brands.forEach((brand) => {
      brandIdMap[brand.name] = brand.id;
    });

    // 6. Update brand images based on mapping
    console.log("\n🔄 Step 4: Updating brand images...");

    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const brandName of brandNames) {
      const imageFilename = mapping[brandName];
      const brandId = brandIdMap[brandName];

      if (!brandId) {
        console.log(`⚠️ Skipping '${brandName}': Brand not found in database`);
        skippedCount++;
        continue;
      }

      // Create the full image URL
      const imageUrl = `${supabaseUrl}/storage/v1/object/public/brand-assets/${imageFilename}`;

      try {
        console.log(`\n🔄 Updating ${brandName}:`);
        console.log(`   📸 Image: ${imageFilename}`);
        console.log(`   🔗 URL: ${imageUrl}`);

        const { error: updateError } = await supabase
          .from("brands")
          .update({ image: imageUrl })
          .eq("id", brandId);

        if (updateError) {
          console.error(
            `   ❌ Error updating ${brandName}:`,
            updateError.message
          );
          errorCount++;
        } else {
          console.log(`   ✅ Successfully updated ${brandName}`);
          updatedCount++;
        }
      } catch (e) {
        console.error(`   ❌ Exception updating ${brandName}:`, e.message);
        errorCount++;
      }
    }

    // 7. Verification
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
      console.log(`   ⚠️ Skipped: ${skippedCount}`);
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

    // 8. Summary
    console.log("\n" + "=".repeat(70));
    console.log("🎯 Brand image update from mapping completed!");

    if (updatedCount > 0) {
      console.log(`\n✅ Successfully updated ${updatedCount} brand images`);
      console.log(`   - All updates based on your manual mapping`);
      console.log(`   - Images now match your original brand setup`);
      console.log(`   - No more chronological matching issues`);

      console.log("\n🚀 Next steps:");
      console.log("   1. Clear your browser cache completely");
      console.log("   2. Hard refresh the homepage (Ctrl+F5 or Cmd+Shift+R)");
      console.log("   3. Brand images should now display correctly");
      console.log("   4. Each brand should have its proper, original image");

      console.log("\n💡 What was fixed:");
      console.log(
        "   - Replaced chronological matching with your manual mapping"
      );
      console.log("   - Each brand now has the image you originally intended");
      console.log("   - Brand images are now accurate to your original setup");
    } else {
      console.log("\n❌ No brand images were updated");
      console.log("   - Check your mapping file for errors");
      console.log("   - Verify brand names match exactly");
    }
  } catch (error) {
    console.error("❌ Error in updateBrandImagesFromMapping:", error);
  }
}

// Run the update
updateBrandImagesFromMapping()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
