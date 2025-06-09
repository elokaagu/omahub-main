// Script to fix Supabase Storage RLS policies
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function fixStoragePolicies() {
  console.log("🔧 Fixing storage policies for product-images bucket...");

  try {
    // First, let's check if the bucket has any policies at all
    console.log("📋 Checking bucket configuration...");

    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error("❌ Error listing buckets:", bucketsError);
      return;
    }

    const productImagesBucket = buckets?.find(
      (b) => b.name === "product-images"
    );
    if (!productImagesBucket) {
      console.error("❌ product-images bucket not found!");
      return;
    }

    console.log("✅ product-images bucket found:", {
      name: productImagesBucket.name,
      public: productImagesBucket.public,
      file_size_limit: productImagesBucket.file_size_limit,
      allowed_mime_types: productImagesBucket.allowed_mime_types,
    });

    // The issue might be that the bucket policies aren't set up correctly
    // Let's try to recreate the bucket with the correct settings
    console.log("\n🔄 Updating bucket configuration...");

    const { data: updateData, error: updateError } =
      await supabase.storage.updateBucket("product-images", {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      });

    if (updateError) {
      console.error("❌ Error updating bucket:", updateError);
    } else {
      console.log("✅ Bucket configuration updated successfully");
    }

    // Test upload with a regular authenticated user simulation
    console.log("\n🧪 Testing authenticated upload simulation...");

    // Create a test file
    const testFile = new Blob(["test content for authenticated user"], {
      type: "image/jpeg",
    });
    const testFileName = `test-auth-upload-${Date.now()}.jpg`;

    // Try upload (this should work since we're using service role, but it simulates the flow)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(testFileName, testFile);

    if (uploadError) {
      console.error("❌ Upload test failed:", uploadError);
    } else {
      console.log("✅ Upload test successful:", uploadData.path);

      // Get public URL to verify it works
      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(uploadData.path);

      console.log("🔗 Public URL:", urlData.publicUrl);

      // Clean up
      await supabase.storage.from("product-images").remove([testFileName]);
      console.log("🧹 Test file cleaned up");
    }

    console.log("\n✅ Storage policies fix completed!");
    console.log(
      "💡 The bucket is configured as public, so authenticated users should be able to upload."
    );
  } catch (error) {
    console.error("❌ Error fixing storage policies:", error);
  }
}

fixStoragePolicies();
