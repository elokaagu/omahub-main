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

async function setupProductImagesPolicies() {
  try {
    console.log("🔐 Setting up storage policies for product-images bucket...");

    // First, ensure the bucket exists and is properly configured
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

    console.log("✅ product-images bucket found:", {
      name: productBucket.name,
      public: productBucket.public,
      file_size_limit: productBucket.file_size_limit,
      allowed_mime_types: productBucket.allowed_mime_types,
    });

    // Use direct SQL to set up policies
    console.log("🔧 Setting up storage policies with direct SQL...");

    // Drop existing policies first
    const dropPoliciesSQL = `
      DROP POLICY IF EXISTS "product-images_public_select" ON storage.objects;
      DROP POLICY IF EXISTS "product-images_auth_insert" ON storage.objects;
      DROP POLICY IF EXISTS "product-images_owner_update" ON storage.objects;
      DROP POLICY IF EXISTS "product-images_owner_delete" ON storage.objects;
    `;

    const { error: dropError } = await supabase.rpc("exec_sql", {
      sql: dropPoliciesSQL,
    });
    if (dropError && !dropError.message.includes("does not exist")) {
      console.warn("⚠️ Warning dropping policies:", dropError.message);
    } else {
      console.log("🗑️ Existing policies dropped");
    }

    // Create new policies
    const createPoliciesSQL = `
      -- Public read access (anyone can view product images)
      CREATE POLICY "product-images_public_select"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'product-images');

      -- Authenticated insert access with role check
      CREATE POLICY "product-images_auth_insert"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'product-images' 
        AND auth.role() = 'authenticated'
        AND EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('super_admin', 'admin', 'brand_admin')
        )
      );

      -- Owner update access
      CREATE POLICY "product-images_owner_update"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'product-images' 
        AND auth.uid() = owner
      );

      -- Owner delete access
      CREATE POLICY "product-images_owner_delete"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'product-images' 
        AND auth.uid() = owner
      );
    `;

    const { error: createError } = await supabase.rpc("exec_sql", {
      sql: createPoliciesSQL,
    });
    if (createError) {
      console.error("❌ Error creating policies:", createError);

      // Try alternative approach - create policies one by one
      console.log("🔄 Trying alternative approach...");

      const policies = [
        {
          name: "Public select",
          sql: `CREATE POLICY "product-images_public_select" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');`,
        },
        {
          name: "Authenticated insert with role check",
          sql: `CREATE POLICY "product-images_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin', 'brand_admin')));`,
        },
      ];

      for (const policy of policies) {
        try {
          const { error: policyError } = await supabase.rpc("exec_sql", {
            sql: policy.sql,
          });
          if (policyError) {
            console.warn(
              `⚠️ ${policy.name} policy issue:`,
              policyError.message
            );
          } else {
            console.log(`✅ ${policy.name} policy created`);
          }
        } catch (err) {
          console.warn(`⚠️ ${policy.name} policy error:`, err.message);
        }
      }
    } else {
      console.log("✅ All storage policies created successfully");
    }

    // Test the setup
    console.log("\n🧪 Testing the setup...");

    // Test upload with service role
    const testFile = new Blob(["test content"], { type: "image/jpeg" });
    const testFileName = `test-policy-upload-${Date.now()}.jpg`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(testFileName, testFile);

    if (uploadError) {
      console.error("❌ Test upload failed:", uploadError);
    } else {
      console.log("✅ Test upload successful:", uploadData.path);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(uploadData.path);

      console.log("🔗 Public URL:", urlData.publicUrl);

      // Clean up
      await supabase.storage.from("product-images").remove([testFileName]);
      console.log("🧹 Test file cleaned up");
    }

    console.log("\n✅ Product images storage policies setup completed!");
    console.log(
      "💡 Users with roles 'super_admin', 'admin', or 'brand_admin' can now upload product images."
    );
  } catch (error) {
    console.error("❌ Error setting up policies:", error);
  }
}

// Run the setup
setupProductImagesPolicies();
