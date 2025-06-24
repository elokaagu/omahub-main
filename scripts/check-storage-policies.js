const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkStoragePolicies() {
  console.log("🔐 Checking storage policies for product-images bucket...");

  try {
    // Check if we can query storage policies
    const { data: policies, error: policyError } = await supabase
      .from("storage.policies")
      .select("*")
      .eq("bucket_id", "product-images");

    if (policyError) {
      console.log(
        "⚠️  Could not query storage policies directly:",
        policyError.message
      );
      console.log("This is normal - storage policies require special access");
    } else {
      console.log("📋 Storage policies for product-images bucket:");
      policies?.forEach((policy) => {
        console.log(`  • ${policy.name}: ${policy.definition}`);
      });
    }

    // Test actual upload capability with service role
    console.log("\n🧪 Testing upload capability with service role...");

    // Create a small test file buffer
    const testFileContent = Buffer.from("test image content");
    const testFileName = `test-${Date.now()}.txt`;

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(testFileName, testFileContent, {
          contentType: "text/plain",
          cacheControl: "3600",
        });

      if (uploadError) {
        console.log("❌ Upload test failed:", uploadError.message);

        if (uploadError.message.includes("row-level security")) {
          console.log("🔍 This suggests RLS policies are blocking uploads");
          console.log(
            "💡 You may need to create storage policies for product-images bucket"
          );
        }
      } else {
        console.log("✅ Upload test successful:", uploadData.path);

        // Clean up test file
        await supabase.storage.from("product-images").remove([testFileName]);
        console.log("🧹 Test file cleaned up");
      }
    } catch (error) {
      console.log("❌ Upload test error:", error.message);
    }

    // Check bucket configuration
    console.log("\n🗂️  Checking bucket configuration...");
    const { data: buckets, error: bucketError } =
      await supabase.storage.listBuckets();

    if (!bucketError && buckets) {
      const productBucket = buckets.find((b) => b.name === "product-images");
      if (productBucket) {
        console.log("📊 Bucket details:");
        console.log(`  • Name: ${productBucket.name}`);
        console.log(`  • Public: ${productBucket.public}`);
        console.log(
          `  • File size limit: ${productBucket.file_size_limit || "Not set"}`
        );
        console.log(
          `  • Allowed MIME types: ${productBucket.allowed_mime_types?.join(", ") || "All types allowed"}`
        );
      }
    }

    // Provide recommendations
    console.log("\n💡 Recommendations:");
    console.log("1. Ensure the product-images bucket has proper RLS policies");
    console.log(
      "2. Create policies that allow super_admin, admin, and brand_owner roles to upload"
    );
    console.log("3. Test uploads from the frontend with a super admin account");

    console.log("\n📝 Sample storage policy for product-images bucket:");
    console.log(`
CREATE POLICY "Allow authenticated users to upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin', 'brand_owner')
  )
);

CREATE POLICY "Allow public read access to product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Allow owners to update their product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin', 'brand_owner')
  )
);

CREATE POLICY "Allow owners to delete their product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin', 'brand_owner')
  )
);
    `);
  } catch (error) {
    console.error("❌ Error checking storage policies:", error);
  }
}

checkStoragePolicies();
