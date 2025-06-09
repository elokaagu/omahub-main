const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkStoragePolicies() {
  console.log("🔍 Checking storage policies...");

  try {
    // Check policies for product-images bucket
    const { data, error } = await supabase.rpc("exec_sql", {
      sql: `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
            FROM pg_policies 
            WHERE tablename = 'objects' 
            AND schemaname = 'storage' 
            AND policyname LIKE 'product-images%';`,
    });

    if (error) {
      console.error("❌ Error checking policies:", error);
    } else {
      console.log("📋 Current product-images policies:");
      if (data && data.length > 0) {
        data.forEach((policy) => {
          console.log(`- ${policy.policyname} (${policy.cmd}): ${policy.qual}`);
        });
      } else {
        console.log("⚠️ No policies found for product-images bucket!");
      }
    }

    // Test upload with service role to see if bucket works
    console.log("\n🧪 Testing upload with service role...");
    const testFile = new Blob(["test content"], { type: "image/jpeg" });
    const testFileName = `test-service-upload-${Date.now()}.jpg`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(testFileName, testFile);

    if (uploadError) {
      console.error("❌ Service role upload failed:", uploadError);
    } else {
      console.log("✅ Service role upload successful:", uploadData.path);

      // Clean up
      await supabase.storage.from("product-images").remove([testFileName]);
      console.log("🧹 Test file cleaned up");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

checkStoragePolicies();
