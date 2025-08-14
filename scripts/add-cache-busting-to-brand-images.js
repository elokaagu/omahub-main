const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

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

async function addCacheBustingToBrandImages() {
  try {
    console.log("🔍 Adding cache-busting parameters to brand images...");

    // Get all brands
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image")
      .order("name");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    console.log(`📋 Found ${brands.length} brands`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const brand of brands) {
      if (brand.image && !brand.image.includes("placeholder")) {
        try {
          // Add a cache-busting timestamp parameter
          const timestamp = Date.now();
          const separator = brand.image.includes("?") ? "&" : "?";
          const newImageUrl = `${brand.image}${separator}v=${timestamp}`;

          console.log(`🔄 Updating ${brand.name}:`);
          console.log(`   Old: ${brand.image}`);
          console.log(`   New: ${newImageUrl}`);

          const { error: updateError } = await supabase
            .from("brands")
            .update({ image: newImageUrl })
            .eq("id", brand.id);

          if (updateError) {
            console.error(
              `   ❌ Error updating ${brand.name}:`,
              updateError.message
            );
            errorCount++;
          } else {
            console.log(`   ✅ Successfully updated ${brand.name}`);
            updatedCount++;
          }
        } catch (e) {
          console.error(`   ❌ Exception updating ${brand.name}:`, e.message);
          errorCount++;
        }
      } else {
        console.log(`   ⚠️ Skipping ${brand.name} (no image or placeholder)`);
      }
    }

    console.log(`\n🎯 Cache-busting update completed!`);
    console.log(`   ✅ Successfully updated: ${updatedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📋 Total brands: ${brands.length}`);

    if (updatedCount > 0) {
      console.log(`\n💡 Next steps:`);
      console.log(`   1. Clear your browser cache completely`);
      console.log(`   2. Hard refresh the homepage (Ctrl+F5 or Cmd+Shift+R)`);
      console.log(`   3. The brand images should now display correctly`);
      console.log(`   4. Each image now has a unique timestamp parameter`);
    }
  } catch (error) {
    console.error("❌ Error in addCacheBustingToBrandImages:", error);
  }
}

// Run the cache-busting update
addCacheBustingToBrandImages()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
