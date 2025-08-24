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

async function fixBrandBucketUrls() {
  try {
    console.log("🔧 Fixing brand image bucket URLs...");
    console.log("======================================================================");

    // Get all brands with their current image URLs
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image")
      .order("name");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    console.log(`📋 Found ${brands.length} brands to check`);

    let fixedCount = 0;
    let alreadyCorrectCount = 0;
    let missingImageCount = 0;

    for (const brand of brands) {
      if (!brand.image) {
        console.log(`⚠️  ${brand.name}: No image set`);
        missingImageCount++;
        continue;
      }

      const currentUrl = brand.image;
      const filename = currentUrl.split("/").pop();
      
      // Check if URL is pointing to wrong bucket
      if (currentUrl.includes("/product-images/")) {
        // Fix: Change from product-images to brand-assets
        const newUrl = currentUrl.replace("/product-images/", "/brand-assets/");
        
        console.log(`🔧 ${brand.name}: Fixing bucket URL`);
        console.log(`   From: ${currentUrl}`);
        console.log(`   To:   ${newUrl}`);

        // Update the brand's image URL
        const { error: updateError } = await supabase
          .from("brands")
          .update({ image: newUrl })
          .eq("id", brand.id);

        if (updateError) {
          console.error(`❌ Failed to update ${brand.name}:`, updateError);
        } else {
          console.log(`✅ Updated ${brand.name}`);
          fixedCount++;
        }
      } else if (currentUrl.includes("/brand-assets/")) {
        console.log(`✅ ${brand.name}: Already correct (brand-assets)`);
        alreadyCorrectCount++;
      } else {
        console.log(`ℹ️  ${brand.name}: Different bucket structure: ${currentUrl}`);
        alreadyCorrectCount++;
      }
    }

    console.log("\n======================================================================");
    console.log("🎯 Brand bucket URL fix completed!");
    console.log(`📊 Summary:`);
    console.log(`   ✅ Fixed: ${fixedCount} brands`);
    console.log(`   ✅ Already correct: ${alreadyCorrectCount} brands`);
    console.log(`   ⚠️  Missing images: ${missingImageCount} brands`);
    console.log("🏁 Script completed");

  } catch (error) {
    console.error("❌ Script error:", error);
  }
}

// Run the script
fixBrandBucketUrls();
