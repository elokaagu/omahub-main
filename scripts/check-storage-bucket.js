require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

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

async function checkStorageBucket() {
  try {
    console.log("🔍 Checking Supabase storage bucket contents...");
    console.log("======================================================================");

    // Check brand-images bucket
    console.log("\n📋 Checking brand-images bucket...");
    const { data: brandImages, error: brandImagesError } = await supabase.storage
      .from("brand-images")
      .list("", { limit: 100, sortBy: { column: "name", order: "asc" } });

    if (brandImagesError) {
      console.error("❌ Error listing brand-images:", brandImagesError);
    } else {
      console.log(`✅ Found ${brandImages.length} files in brand-images bucket`);
      console.log("📋 Sample files (first 10):");
      brandImages.slice(0, 10).forEach(file => {
        console.log(`   - ${file.name} (${file.size} bytes, ${file.updated_at})`);
      });
    }

    // Check brand-assets bucket
    console.log("\n📋 Checking brand-assets bucket...");
    const { data: brandAssets, error: brandAssetsError } = await supabase.storage
      .from("brand-assets")
      .list("", { limit: 100, sortBy: { column: "name", order: "asc" } });

    if (brandAssetsError) {
      console.error("❌ Error listing brand-assets:", brandAssetsError);
    } else {
      console.log(`✅ Found ${brandAssets.length} files in brand-assets bucket`);
      console.log("📋 Sample files (first 10):");
      brandAssets.slice(0, 10).forEach(file => {
        console.log(`   - ${file.name} (${file.size} bytes, ${file.updated_at})`);
      });
    }

    // Check lovable-uploads bucket
    console.log("\n📋 Checking lovable-uploads bucket...");
    const { data: lovableUploads, error: lovableUploadsError } = await supabase.storage
      .from("lovable-uploads")
      .list("", { limit: 100, sortBy: { column: "name", order: "asc" } });

    if (lovableUploadsError) {
      console.error("❌ Error listing lovable-uploads:", lovableUploadsError);
    } else {
      console.log(`✅ Found ${lovableUploads.length} files in lovable-uploads bucket`);
      console.log("📋 Sample files (first 10):");
      lovableUploads.slice(0, 10).forEach(file => {
        console.log(`   - ${file.name} (${file.size} bytes, ${file.updated_at})`);
      });
    }

    // Now check specific brands that are showing placeholders
    console.log("\n🔍 Checking specific brands with image issues...");
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image")
      .order("name");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    console.log("\n📊 Brand image analysis:");
    brands.forEach(brand => {
      if (brand.image) {
        const imagePath = brand.image.split("/").pop();
        console.log(`\n🏷️  ${brand.name}:`);
        console.log(`   Image: ${brand.image}`);
        console.log(`   Filename: ${imagePath}`);
        
        // Check if this file exists in any bucket
        let foundInBucket = null;
        if (brandImages && brandImages.some(f => f.name === imagePath)) {
          foundInBucket = "brand-images";
        } else if (brandAssets && brandAssets.some(f => f.name === imagePath)) {
          foundInBucket = "brand-assets";
        } else if (lovableUploads && lovableUploads.some(f => f.name === imagePath)) {
          foundInBucket = "lovable-uploads";
        }
        
        if (foundInBucket) {
          console.log(`   ✅ Found in ${foundInBucket} bucket`);
        } else {
          console.log(`   ❌ NOT FOUND in any bucket!`);
        }
      }
    });

    console.log("\n======================================================================");
    console.log("🎯 Storage bucket check completed!");
    console.log("🏁 Script completed");

  } catch (error) {
    console.error("❌ Script error:", error);
  }
}

// Run the script
checkStorageBucket();
