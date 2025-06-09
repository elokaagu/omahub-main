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

async function setupProductImagesBucket() {
  try {
    console.log("🛍️ Setting up product-images bucket...");

    // List existing buckets
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return;
    }

    console.log(
      "Current buckets:",
      buckets ? buckets.map((b) => b.name).join(", ") : "none"
    );

    // Create product-images bucket if it doesn't exist
    if (
      !buckets ||
      !buckets.find((bucket) => bucket.name === "product-images")
    ) {
      console.log("Creating product-images bucket");
      const { data, error } = await supabase.storage.createBucket(
        "product-images",
        {
          public: true,
          fileSizeLimit: 10485760, // 10MB limit for product images
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        }
      );

      if (error) {
        console.error("Error creating product-images bucket:", error);
        return;
      } else {
        console.log("✅ Created product-images bucket successfully:", data);
      }
    } else {
      console.log("✅ product-images bucket already exists");
    }

    // Set up storage policies for product-images bucket
    console.log("🔐 Setting up storage policies for product-images...");

    const policySQL = `
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "product-images_public_select" ON storage.objects;
      DROP POLICY IF EXISTS "product-images_auth_insert" ON storage.objects;
      DROP POLICY IF EXISTS "product-images_owner_update" ON storage.objects;
      DROP POLICY IF EXISTS "product-images_owner_delete" ON storage.objects;

      -- Create policies for product-images bucket
      -- Public read access (anyone can view product images)
      CREATE POLICY "product-images_public_select"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'product-images');

      -- Authenticated insert access (authenticated users can upload product images)
      CREATE POLICY "product-images_auth_insert"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'product-images' 
        AND auth.role() = 'authenticated'
      );

      -- Owner update access (users can update their own uploads)
      CREATE POLICY "product-images_owner_update"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'product-images' 
        AND auth.uid() = owner
      );

      -- Owner delete access (users can delete their own uploads)
      CREATE POLICY "product-images_owner_delete"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'product-images' 
        AND auth.uid() = owner
      );
    `;

    const { error: policyError } = await supabase.rpc("exec_sql", {
      sql: policySQL,
    });

    if (policyError) {
      console.error("Error setting up policies:", policyError);
      // Try alternative approach using individual policy creation
      console.log("Trying alternative policy setup...");

      // Create policies one by one
      const policies = [
        {
          name: "product-images_public_select",
          sql: `CREATE POLICY "product-images_public_select" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');`,
        },
        {
          name: "product-images_auth_insert",
          sql: `CREATE POLICY "product-images_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');`,
        },
      ];

      for (const policy of policies) {
        try {
          await supabase.rpc("exec_sql", { sql: policy.sql });
          console.log(`✅ Created policy: ${policy.name}`);
        } catch (err) {
          console.log(
            `⚠️ Policy ${policy.name} might already exist or failed:`,
            err
          );
        }
      }
    } else {
      console.log("✅ Storage policies set up successfully");
    }

    // Test upload to product-images bucket
    console.log("🧪 Testing upload to product-images bucket...");
    const testFile = new Blob(["test content"], { type: "text/plain" });
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product-images")
      .upload("test-upload.txt", testFile);

    if (uploadError) {
      console.error("❌ Upload test failed:", uploadError);
    } else {
      console.log("✅ Upload test successful:", uploadData);

      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from("product-images")
        .remove(["test-upload.txt"]);

      if (deleteError) {
        console.warn("⚠️ Could not clean up test file:", deleteError);
      } else {
        console.log("🧹 Test file cleaned up successfully");
      }
    }

    console.log("🎉 Product images storage setup completed!");
  } catch (error) {
    console.error("❌ Error setting up product images storage:", error);
  }
}

// Run the setup
setupProductImagesBucket();
