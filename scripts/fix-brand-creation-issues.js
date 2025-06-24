const { createClient } = require("@supabase/supabase-js");

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "❌ Supabase credentials are missing. Make sure .env.local is set up correctly."
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

async function fixBrandCreationIssues() {
  console.log("🔧 Starting comprehensive fix for brand creation issues...");

  try {
    // Step 1: Check and create brand-assets bucket
    console.log("📦 Checking brand-assets bucket...");

    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error("❌ Error listing buckets:", bucketsError);
      return;
    }

    const brandAssetsBucket = buckets?.find(
      (bucket) => bucket.name === "brand-assets"
    );

    if (!brandAssetsBucket) {
      console.log("🆕 Creating brand-assets bucket...");
      const { data, error } = await supabase.storage.createBucket(
        "brand-assets",
        {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
          ],
        }
      );

      if (error) {
        console.error("❌ Error creating brand-assets bucket:", error);
        return;
      } else {
        console.log("✅ Created brand-assets bucket successfully");
      }
    } else {
      console.log("✅ brand-assets bucket already exists");

      // Update bucket to ensure it's public
      const { error: updateError } = await supabase.storage.updateBucket(
        "brand-assets",
        {
          public: true,
          fileSizeLimit: 10485760,
          allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
          ],
        }
      );

      if (updateError) {
        console.warn("⚠️ Warning updating bucket:", updateError.message);
      } else {
        console.log("✅ Updated brand-assets bucket configuration");
      }
    }

    // Step 2: Test upload to brand-assets bucket
    console.log("🧪 Testing upload to brand-assets bucket...");
    const testFile = new Blob(["test content for brand creation"], {
      type: "text/plain",
    });
    const testFileName = `test-brand-upload-${Date.now()}.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("brand-assets")
      .upload(testFileName, testFile);

    if (uploadError) {
      console.error("❌ Upload test failed:", uploadError);
      console.log(
        "🔍 This indicates a permissions issue. Please run the SQL script in Supabase Dashboard."
      );
    } else {
      console.log("✅ Upload test successful:", uploadData.path);

      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from("brand-assets")
        .remove([testFileName]);

      if (deleteError) {
        console.warn("⚠️ Could not clean up test file:", deleteError);
      } else {
        console.log("🧹 Test file cleaned up successfully");
      }
    }

    // Step 3: Check brands table permissions
    console.log("🏷️ Testing brands table access...");

    const { data: brandsData, error: brandsError } = await supabase
      .from("brands")
      .select("id, name")
      .limit(1);

    if (brandsError) {
      console.error("❌ Error accessing brands table:", brandsError);
    } else {
      console.log("✅ Brands table access successful");
    }

    // Step 4: Test brand creation
    console.log("🧪 Testing brand creation...");

    const testBrand = {
      name: `Test Brand ${Date.now()}`,
      description: "Test brand for validation",
      long_description:
        "This is a test brand created to validate the brand creation process.",
      location: "Test Location",
      price_range: "100-500",
      category: "Fashion",
      rating: 0,
      is_verified: false,
      image: "",
      website: "https://example.com",
      instagram: "@testbrand",
      founded_year: "2024",
    };

    const { data: createData, error: createError } = await supabase
      .from("brands")
      .insert([testBrand])
      .select()
      .single();

    if (createError) {
      console.error("❌ Brand creation test failed:", createError);
      console.log(
        "🔍 This indicates a database permissions issue. Please run the SQL script in Supabase Dashboard."
      );
    } else {
      console.log("✅ Brand creation test successful:", createData.id);

      // Clean up test brand
      const { error: deleteError } = await supabase
        .from("brands")
        .delete()
        .eq("id", createData.id);

      if (deleteError) {
        console.warn("⚠️ Could not clean up test brand:", deleteError);
      } else {
        console.log("🧹 Test brand cleaned up successfully");
      }
    }

    console.log("\n🎉 Brand creation issues diagnosis completed!");
    console.log("\n📋 Next Steps:");
    console.log(
      "1. If upload test failed: Run the SQL script 'scripts/fix-brand-creation-storage.sql' in your Supabase Dashboard"
    );
    console.log(
      "2. If brand creation failed: Check your database RLS policies"
    );
    console.log("3. Try creating a brand again in the studio");
  } catch (error) {
    console.error("❌ Error during brand creation fix:", error);
  }
}

// Run the fix
fixBrandCreationIssues();
