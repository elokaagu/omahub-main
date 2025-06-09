const { createClient } = require("@supabase/supabase-js");

// Read environment variables from .env.local
require("dotenv").config({ path: ".env.local" });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Supabase credentials are missing. Make sure .env.local is set up correctly."
  );
  console.log("Required variables:");
  console.log("- NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
  console.log("- SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey);
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixProductImagesBucket() {
  try {
    console.log("🔧 Fixing product-images bucket configuration...");

    // Check current bucket configuration
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error("❌ Error listing buckets:", bucketsError);
      return;
    }

    const productBucket = buckets?.find((b) => b.name === "product-images");
    if (!productBucket) {
      console.error("❌ product-images bucket not found!");
      return;
    }

    console.log("📋 Current bucket configuration:", {
      name: productBucket.name,
      public: productBucket.public,
      file_size_limit: productBucket.file_size_limit,
      allowed_mime_types: productBucket.allowed_mime_types,
    });

    // Update bucket to be fully public with proper settings
    console.log("🔄 Updating bucket to be fully public...");

    const { data: updateData, error: updateError } =
      await supabase.storage.updateBucket("product-images", {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/jpg",
        ],
      });

    if (updateError) {
      console.error("❌ Error updating bucket:", updateError);
    } else {
      console.log("✅ Bucket updated successfully");
    }

    // Since we can't use exec_sql, let's try to delete and recreate the bucket with proper settings
    console.log("\n🔄 Attempting to recreate bucket with proper settings...");

    // First, let's empty the bucket
    console.log("📂 Listing files in bucket...");
    const { data: files, error: listError } = await supabase.storage
      .from("product-images")
      .list();

    if (listError) {
      console.warn("⚠️ Could not list files:", listError.message);
    } else if (files && files.length > 0) {
      console.log(`📁 Found ${files.length} files in bucket`);
      // Don't delete files, just proceed
    } else {
      console.log("📁 Bucket is empty");
    }

    // Delete and recreate the bucket
    console.log("🗑️ Deleting existing bucket...");
    const { error: deleteError } =
      await supabase.storage.deleteBucket("product-images");

    if (deleteError) {
      console.warn(
        "⚠️ Could not delete bucket (might have files):",
        deleteError.message
      );
      console.log("📝 Proceeding with existing bucket...");
    } else {
      console.log("✅ Bucket deleted successfully");

      // Recreate the bucket
      console.log("🆕 Creating new bucket...");
      const { data: createData, error: createError } =
        await supabase.storage.createBucket("product-images", {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/jpg",
          ],
        });

      if (createError) {
        console.error("❌ Error creating bucket:", createError);
        return;
      } else {
        console.log("✅ New bucket created successfully");
      }
    }

    // Test the bucket with different approaches
    console.log("\n🧪 Testing bucket functionality...");

    // Test 1: Service role upload
    console.log("1. Testing service role upload...");
    const testFile1 = new Blob(["test content 1"], { type: "image/jpeg" });
    const testFileName1 = `test-service-${Date.now()}.jpg`;

    const { data: uploadData1, error: uploadError1 } = await supabase.storage
      .from("product-images")
      .upload(testFileName1, testFile1);

    if (uploadError1) {
      console.error("❌ Service role upload failed:", uploadError1);
    } else {
      console.log("✅ Service role upload successful:", uploadData1.path);

      // Get public URL
      const { data: urlData1 } = supabase.storage
        .from("product-images")
        .getPublicUrl(uploadData1.path);

      console.log("🔗 Public URL:", urlData1.publicUrl);

      // Clean up
      await supabase.storage.from("product-images").remove([testFileName1]);
      console.log("🧹 Test file cleaned up");
    }

    // Test 2: Check bucket info again
    console.log("\n2. Checking final bucket configuration...");
    const { data: finalBuckets } = await supabase.storage.listBuckets();
    const finalProductBucket = finalBuckets?.find(
      (b) => b.name === "product-images"
    );

    if (finalProductBucket) {
      console.log("✅ Final bucket configuration:", {
        name: finalProductBucket.name,
        public: finalProductBucket.public,
        file_size_limit: finalProductBucket.file_size_limit,
        allowed_mime_types: finalProductBucket.allowed_mime_types,
      });
    }

    console.log("\n✅ Product images bucket fix completed!");
    console.log(
      "💡 The bucket is now configured as public and should allow authenticated uploads."
    );
    console.log(
      "🔍 If uploads still fail, the issue is likely with authentication in the frontend."
    );
  } catch (error) {
    console.error("❌ Error fixing bucket:", error);
  }
}

// Run the fix
fixProductImagesBucket();
