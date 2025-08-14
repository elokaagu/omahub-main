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

async function findOriginalBrandImages() {
  try {
    console.log("🔍 Searching for original brand images...");
    console.log("=".repeat(60));

    // 1. List all storage buckets
    console.log("\n📦 Step 1: Checking all storage buckets...");

    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error("❌ Error listing buckets:", bucketsError);
      return;
    }

    console.log(`✅ Found ${buckets.length} storage buckets:`);
    buckets.forEach((bucket) => {
      console.log(`   - ${bucket.name}`);
    });

    // 2. Search each bucket for brand-related images
    console.log("\n🔍 Step 2: Searching for brand images in each bucket...");

    const allBrandImages = [];

    for (const bucket of buckets) {
      console.log(`\n📁 Searching bucket: ${bucket.name}`);

      try {
        const { data: files, error: listError } = await supabase.storage
          .from(bucket.name)
          .list("", { limit: 1000 });

        if (listError) {
          console.log(`   ❌ Error listing files: ${listError.message}`);
          continue;
        }

        console.log(`   📋 Found ${files.length} files`);

        // Look for brand-related images
        const brandImages = files.filter((file) => {
          const name = file.name.toLowerCase();
          return (
            file.name.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i) &&
            (name.includes("brand") ||
              name.includes("logo") ||
              name.includes("profile") ||
              name.includes("headshot") ||
              name.includes("portrait") ||
              name.includes("main") ||
              name.includes("primary"))
          );
        });

        if (brandImages.length > 0) {
          console.log(
            `   🖼️ Found ${brandImages.length} potential brand images:`
          );
          brandImages.forEach((img) => {
            console.log(
              `      - ${img.name} (${img.metadata?.size || "unknown"} bytes)`
            );
            allBrandImages.push({
              ...img,
              bucket: bucket.name,
              fullUrl: `${supabaseUrl}/storage/v1/object/public/${bucket.name}/${img.name}`,
            });
          });
        }

        // Also look for any images that might be brand images based on naming patterns
        const potentialBrandImages = files.filter((file) => {
          const name = file.name.toLowerCase();
          return (
            file.name.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i) &&
            !name.includes("product") &&
            !name.includes("collection") &&
            !name.includes("catalogue") &&
            !name.includes("tailor") &&
            !name.includes("service") &&
            (name.includes("2a14c31f") || // This pattern appears in current URLs
              name.includes("175") || // Timestamp pattern
              name.includes("brand") ||
              name.includes("logo"))
          );
        });

        if (potentialBrandImages.length > 0) {
          console.log(
            `   🔍 Found ${potentialBrandImages.length} potential brand images (by exclusion):`
          );
          potentialBrandImages.slice(0, 10).forEach((img) => {
            console.log(
              `      - ${img.name} (${img.metadata?.size || "unknown"} bytes)`
            );
          });
          if (potentialBrandImages.length > 10) {
            console.log(
              `      ... and ${potentialBrandImages.length - 10} more`
            );
          }
        }
      } catch (bucketError) {
        console.log(
          `   ❌ Error accessing bucket ${bucket.name}: ${bucketError.message}`
        );
      }
    }

    // 3. Check if there are any backup or original image fields in the database
    console.log("\n🗄️ Step 3: Checking database for backup image fields...");

    try {
      const { data: sampleBrand, error: sampleError } = await supabase
        .from("brands")
        .select("*")
        .limit(1);

      if (!sampleError && sampleBrand && sampleBrand[0]) {
        const brandColumns = Object.keys(sampleBrand[0]);
        console.log(`   📋 Brand table columns: ${brandColumns.join(", ")}`);

        // Look for any backup or original image fields
        const backupImageFields = brandColumns.filter(
          (col) =>
            col.toLowerCase().includes("original") ||
            col.toLowerCase().includes("backup") ||
            col.toLowerCase().includes("previous") ||
            col.toLowerCase().includes("old")
        );

        if (backupImageFields.length > 0) {
          console.log(
            `   🔍 Found potential backup fields: ${backupImageFields.join(", ")}`
          );
        } else {
          console.log("   ❌ No backup image fields found");
        }
      }
    } catch (dbError) {
      console.log(`   ❌ Error checking database: ${dbError.message}`);
    }

    // 4. Summary and recommendations
    console.log("\n" + "=".repeat(60));
    console.log("🎯 Original brand image search completed!");

    if (allBrandImages.length > 0) {
      console.log(
        `\n✅ Found ${allBrandImages.length} potential original brand images`
      );
      console.log("\n📋 Summary of found images:");
      allBrandImages.forEach((img, index) => {
        console.log(`   ${index + 1}. ${img.name} (${img.bucket})`);
      });

      console.log("\n💡 Next steps:");
      console.log(
        "   1. Review these images to identify which are actual brand images"
      );
      console.log(
        "   2. Create a mapping between brands and their correct images"
      );
      console.log(
        "   3. Update the database with the correct brand-image mappings"
      );
    } else {
      console.log("\n❌ No obvious original brand images found");
      console.log("\n💡 Possible reasons:");
      console.log("   - Original images were deleted or moved");
      console.log("   - Images are stored with different naming conventions");
      console.log("   - Images are in a different storage location");
      console.log("   - Need to check git history for image URLs");
    }

    console.log("\n🔍 Additional investigation needed:");
    console.log("   - Check git commit history for original image URLs");
    console.log("   - Look for any backup or archive of original images");
    console.log("   - Check if images were moved to different buckets");
  } catch (error) {
    console.error("❌ Error in findOriginalBrandImages:", error);
  }
}

// Run the search
findOriginalBrandImages()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
