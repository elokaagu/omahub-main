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

async function checkAllStorageBuckets() {
  try {
    console.log("🔍 Checking ALL storage buckets for original images...");

    // Step 1: List all buckets
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error("❌ Error listing buckets:", bucketsError);
      return;
    }

    console.log("Available buckets:", buckets.map((b) => b.name).join(", "));

    // Step 2: Check each bucket for images
    for (const bucket of buckets) {
      console.log(`\n📦 Checking bucket: ${bucket.name}`);

      try {
        const { data: files, error: listError } = await supabase.storage
          .from(bucket.name)
          .list("", { limit: 1000 });

        if (listError) {
          console.log(`   ❌ Error listing files: ${listError.message}`);
          continue;
        }

        if (!files || files.length === 0) {
          console.log(`   📁 Bucket is empty`);
          continue;
        }

        console.log(`   📁 Found ${files.length} files`);

        // Look for image files
        const imageFiles = files.filter(
          (file) =>
            file.name &&
            (file.name.includes(".jpg") ||
              file.name.includes(".jpeg") ||
              file.name.includes(".png") ||
              file.name.includes(".webp"))
        );

        if (imageFiles.length > 0) {
          console.log(`   📸 Found ${imageFiles.length} image files:`);
          imageFiles.slice(0, 10).forEach((file, index) => {
            console.log(`      ${index + 1}. ${file.name}`);
            if (file.metadata) {
              console.log(`         Size: ${file.metadata.size} bytes`);
            }
          });

          if (imageFiles.length > 10) {
            console.log(`      ... and ${imageFiles.length - 10} more`);
          }
        }

        // Look for folders that might contain images
        const folders = files.filter((file) => !file.name.includes("."));
        if (folders.length > 0) {
          console.log(`   📂 Found ${folders.length} folders:`);
          folders.slice(0, 5).forEach((folder, index) => {
            console.log(`      ${index + 1}. ${folder.name}`);
          });

          if (folders.length > 5) {
            console.log(`      ... and ${folders.length - 5} more`);
          }
        }
      } catch (bucketError) {
        console.log(`   ❌ Error accessing bucket: ${bucketError.message}`);
      }
    }

    console.log("\n🎯 Summary:");
    console.log(
      "Check the output above to see which buckets contain your original images."
    );
    console.log(
      "The images might be in folders within the buckets, or have different naming patterns."
    );
  } catch (error) {
    console.error("❌ Error in checkAllStorageBuckets:", error);
  }
}

// Run the check
checkAllStorageBuckets()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
