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

// Define all buckets needed by the application
const bucketsConfig = [
  {
    name: "product-images",
    config: {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    },
    policies: [
      {
        name: "product-images_public_select",
        sql: `CREATE POLICY "product-images_public_select" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');`,
      },
      {
        name: "product-images_auth_insert",
        sql: `CREATE POLICY "product-images_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');`,
      },
    ],
  },
  {
    name: "spotlight-images",
    config: {
      public: true,
      fileSizeLimit: 20971520, // 20MB for high-res spotlight images
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    },
    policies: [
      {
        name: "spotlight-images_public_select",
        sql: `CREATE POLICY "spotlight-images_public_select" ON storage.objects FOR SELECT USING (bucket_id = 'spotlight-images');`,
      },
      {
        name: "spotlight-images_super_admin_insert",
        sql: `CREATE POLICY "spotlight-images_super_admin_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'spotlight-images' AND auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role::text = 'super_admin'));`,
      },
    ],
  },
  {
    name: "brand-images",
    config: {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    },
    policies: [
      {
        name: "brand-images_public_select",
        sql: `CREATE POLICY "brand-images_public_select" ON storage.objects FOR SELECT USING (bucket_id = 'brand-images');`,
      },
      {
        name: "brand-images_auth_insert",
        sql: `CREATE POLICY "brand-images_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'brand-images' AND auth.role() = 'authenticated');`,
      },
    ],
  },
  {
    name: "product-videos",
    config: {
      public: true,
      fileSizeLimit: 52428800, // 50MB for product videos
      allowedMimeTypes: ["video/mp4", "video/webm", "video/quicktime"],
    },
    policies: [
      {
        name: "product-videos_public_select",
        sql: `CREATE POLICY "product-videos_public_select" ON storage.objects FOR SELECT USING (bucket_id = 'product-videos');`,
      },
      {
        name: "product-videos_auth_insert",
        sql: `CREATE POLICY "product-videos_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-videos' AND auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role::text IN ('super_admin', 'admin', 'brand_admin')));`,
      },
    ],
  },
  {
    name: "spotlight-videos",
    config: {
      public: true,
      fileSizeLimit: 104857600, // 100MB for brand campaign videos
      allowedMimeTypes: ["video/mp4", "video/webm", "video/quicktime"],
    },
    policies: [
      {
        name: "spotlight-videos_public_select",
        sql: `CREATE POLICY "spotlight-videos_public_select" ON storage.objects FOR SELECT USING (bucket_id = 'spotlight-videos');`,
      },
      {
        name: "spotlight-videos_super_admin_insert",
        sql: `CREATE POLICY "spotlight-videos_super_admin_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'spotlight-videos' AND auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role::text = 'super_admin'));`,
      },
    ],
  },
  {
    name: "edition-galleries",
    config: {
      public: true,
      fileSizeLimit: 52428800, // 50MB — project storage cap rejects 150MB
      allowedMimeTypes: [
        "image/jpeg",
        "image/jpg",
        "image/pjpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "video/mp4",
        "video/webm",
        "video/quicktime",
      ],
    },
    policies: [
      {
        name: "edition-galleries_public_select",
        sql: `CREATE POLICY "edition-galleries_public_select" ON storage.objects FOR SELECT USING (bucket_id = 'edition-galleries');`,
      },
      {
        name: "edition-galleries_auth_insert",
        sql: `CREATE POLICY "edition-galleries_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'edition-galleries' AND auth.role() = 'authenticated');`,
      },
      {
        name: "edition-galleries_auth_update",
        sql: `CREATE POLICY "edition-galleries_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'edition-galleries' AND auth.role() = 'authenticated');`,
      },
      {
        name: "edition-galleries_auth_delete",
        sql: `CREATE POLICY "edition-galleries_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'edition-galleries' AND auth.role() = 'authenticated');`,
      },
    ],
  },
];

async function createBucketWithPolicies(bucketConfig) {
  const { name, config, policies } = bucketConfig;

  try {
    console.log(`\n🪣 Setting up ${name} bucket...`);

    // Check if bucket exists
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error(`❌ Error listing buckets:`, bucketsError);
      return false;
    }

    const bucketExists = buckets?.find((bucket) => bucket.name === name);

    if (!bucketExists) {
      console.log(`📦 Creating ${name} bucket...`);
      const { data, error } = await supabase.storage.createBucket(name, config);

      if (error) {
        console.error(`❌ Error creating ${name} bucket:`, error);
        return false;
      } else {
        console.log(`✅ Created ${name} bucket successfully`);
      }
    } else {
      console.log(`✅ ${name} bucket already exists`);
    }

    // Set up policies
    console.log(`🔐 Setting up storage policies for ${name}...`);

    for (const policy of policies) {
      try {
        // Try to create the policy (will fail if it already exists, which is fine)
        await supabase.rpc("exec_sql", { sql: policy.sql });
        console.log(`✅ Created policy: ${policy.name}`);
      } catch (err) {
        // Policy might already exist, try to drop and recreate
        try {
          const dropSql = `DROP POLICY IF EXISTS "${policy.name}" ON storage.objects;`;
          await supabase.rpc("exec_sql", { sql: dropSql });
          await supabase.rpc("exec_sql", { sql: policy.sql });
          console.log(`✅ Recreated policy: ${policy.name}`);
        } catch (recreateErr) {
          console.log(
            `⚠️ Policy ${policy.name} setup issue (might already exist):`,
            recreateErr.message
          );
        }
      }
    }

    // Test upload
    console.log(`🧪 Testing upload to ${name} bucket...`);
    const testFile = new Blob(["test content"], { type: "image/jpeg" });
    const testFileName = `test-upload-${Date.now()}.jpg`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(name)
      .upload(testFileName, testFile);

    if (uploadError) {
      console.error(`❌ Upload test failed for ${name}:`, uploadError);
      return false;
    } else {
      console.log(`✅ Upload test successful for ${name}`);

      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from(name)
        .remove([testFileName]);

      if (deleteError) {
        console.warn(
          `⚠️ Could not clean up test file from ${name}:`,
          deleteError
        );
      } else {
        console.log(`🧹 Test file cleaned up from ${name}`);
      }
    }

    return true;
  } catch (error) {
    console.error(`❌ Error setting up ${name} bucket:`, error);
    return false;
  }
}

async function setupAllStorageBuckets() {
  try {
    console.log("🚀 Setting up all storage buckets...");

    // List existing buckets first
    const { data: existingBuckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error("❌ Error listing existing buckets:", bucketsError);
      return;
    }

    console.log(
      "📋 Current buckets:",
      existingBuckets ? existingBuckets.map((b) => b.name).join(", ") : "none"
    );

    // Set up each bucket
    let successCount = 0;
    for (const bucketConfig of bucketsConfig) {
      const success = await createBucketWithPolicies(bucketConfig);
      if (success) successCount++;
    }

    console.log(
      `\n🎉 Storage setup completed! ${successCount}/${bucketsConfig.length} buckets set up successfully.`
    );

    // Final bucket list
    const { data: finalBuckets } = await supabase.storage.listBuckets();
    console.log(
      "📋 Final buckets:",
      finalBuckets ? finalBuckets.map((b) => b.name).join(", ") : "none"
    );
  } catch (error) {
    console.error("❌ Error in storage setup:", error);
  }
}

// Run the setup
setupAllStorageBuckets();
