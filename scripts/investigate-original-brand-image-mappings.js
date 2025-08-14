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

async function investigateOriginalBrandImageMappings() {
  try {
    console.log("🔍 Investigating original brand-image mappings...");
    console.log("=".repeat(70));

    // 1. Check if there are any clues about original mappings
    console.log("\n🏷️ Step 1: Checking brand table structure and data...");

    const { data: sampleBrand, error: sampleError } = await supabase
      .from("brands")
      .select("*")
      .limit(1);

    if (sampleError) {
      console.error("❌ Error fetching sample brand:", sampleError);
      return;
    }

    if (sampleBrand && sampleBrand[0]) {
      const brandColumns = Object.keys(sampleBrand[0]);
      console.log(`📋 Brand table columns: ${brandColumns.join(", ")}`);

      // Look for any fields that might contain original image info
      const imageRelatedFields = brandColumns.filter(
        (col) =>
          col.toLowerCase().includes("image") ||
          col.toLowerCase().includes("original") ||
          col.toLowerCase().includes("backup") ||
          col.toLowerCase().includes("previous") ||
          col.toLowerCase().includes("old") ||
          col.toLowerCase().includes("first") ||
          col.toLowerCase().includes("initial")
      );

      if (imageRelatedFields.length > 0) {
        console.log(
          `🔍 Found image-related fields: ${imageRelatedFields.join(", ")}`
        );
      } else {
        console.log("❌ No obvious image-related fields found");
      }
    }

    // 2. Get all brands with their current images and creation info
    console.log("\n📊 Step 2: Analyzing current brand-image assignments...");

    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image, created_at, updated_at")
      .order("created_at");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    console.log(`📋 Found ${brands.length} brands`);

    // 3. Analyze the current image patterns
    console.log("\n🔍 Step 3: Analyzing current image patterns...");

    const imageAnalysis = {};

    brands.forEach((brand) => {
      if (brand.image) {
        const urlParts = brand.image.split("/");
        const bucket = urlParts[urlParts.length - 2];
        const filename = urlParts[urlParts.length - 1];

        if (!imageAnalysis[bucket]) {
          imageAnalysis[bucket] = [];
        }

        imageAnalysis[bucket].push({
          brandName: brand.name,
          filename: filename,
          brandCreated: brand.created_at,
          brandUpdated: brand.updated_at,
        });
      }
    });

    console.log("📊 Current image distribution by bucket:");
    Object.keys(imageAnalysis).forEach((bucket) => {
      console.log(`\n   📦 ${bucket}: ${imageAnalysis[bucket].length} images`);
      imageAnalysis[bucket].slice(0, 5).forEach((img) => {
        console.log(`      - ${img.brandName}: ${img.filename}`);
      });
      if (imageAnalysis[bucket].length > 5) {
        console.log(`      ... and ${imageAnalysis[bucket].length - 5} more`);
      }
    });

    // 4. Check if there are any patterns that suggest original mappings
    console.log("\n🔍 Step 4: Looking for original mapping patterns...");

    // Check if there are any brands with images that might be their original ones
    const brandsWithBrandAssets = brands.filter(
      (brand) => brand.image && brand.image.includes("brand-assets")
    );

    if (brandsWithBrandAssets.length > 0) {
      console.log(
        `✅ Found ${brandsWithBrandAssets.length} brands with brand-assets images`
      );
      console.log("   These might be closer to the original assignments");

      brandsWithBrandAssets.slice(0, 10).forEach((brand) => {
        const filename = brand.image.split("/").pop();
        console.log(`   - ${brand.name}: ${filename}`);
      });
    }

    // 5. Check for any naming patterns that might reveal original mappings
    console.log("\n🔍 Step 5: Analyzing filename patterns...");

    const filenamePatterns = {};

    brands.forEach((brand) => {
      if (brand.image) {
        const filename = brand.image.split("/").pop();
        const prefix = filename.split("_")[0];

        if (!filenamePatterns[prefix]) {
          filenamePatterns[prefix] = [];
        }

        filenamePatterns[prefix].push({
          brandName: brand.name,
          filename: filename,
        });
      }
    });

    console.log("📊 Filename prefix patterns:");
    Object.keys(filenamePatterns).forEach((prefix) => {
      console.log(
        `\n   🔤 ${prefix}: ${filenamePatterns[prefix].length} images`
      );
      filenamePatterns[prefix].forEach((img) => {
        console.log(`      - ${img.brandName}: ${img.filename}`);
      });
    });

    // 6. Recommendations
    console.log("\n" + "=".repeat(70));
    console.log("🎯 Investigation completed!");

    console.log("\n💡 Key findings:");
    console.log(`   - Total brands: ${brands.length}`);
    console.log(
      `   - Brands with brand-assets images: ${brandsWithBrandAssets.length}`
    );
    console.log(
      `   - Brands with other bucket images: ${brands.length - brandsWithBrandAssets.length}`
    );

    if (brandsWithBrandAssets.length === brands.length) {
      console.log("\n✅ All brands now have brand-assets images!");
      console.log("   This suggests the restoration was successful");
    } else if (brandsWithBrandAssets.length > 0) {
      console.log("\n⚠️ Some brands have brand-assets images, others don't");
      console.log("   This suggests partial restoration");
    } else {
      console.log("\n❌ No brands have brand-assets images");
      console.log("   This suggests the restoration didn't work");
    }

    console.log("\n🔍 Next steps to find original mappings:");
    console.log(
      "   1. Check if you have any records of original brand-image assignments"
    );
    console.log(
      "   2. Look at the actual images to see which ones match which brands"
    );
    console.log(
      "   3. Consider manually mapping each brand to its correct image"
    );
    console.log("   4. Check if there are any backup databases or exports");

    console.log("\n💡 Manual mapping approach:");
    console.log("   - List all brands and their current images");
    console.log("   - List all available images in brand-assets bucket");
    console.log("   - Manually assign the correct image to each brand");
    console.log("   - Update the database with the correct mappings");
  } catch (error) {
    console.error("❌ Error in investigateOriginalBrandImageMappings:", error);
  }
}

// Run the investigation
investigateOriginalBrandImageMappings()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
