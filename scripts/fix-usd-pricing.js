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

async function fixUSDPricing() {
  try {
    console.log("🔧 Fixing USD pricing to Nigerian Naira...");
    console.log("======================================================================");

    // Step 1: Find all brands with USD pricing
    console.log("\n📋 Step 1: Finding brands with USD pricing...");
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, price_range, location")
      .or("price_range.like.%$%,price_range.like.%USD%");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    if (!brands || brands.length === 0) {
      console.log("✅ No brands with USD pricing found!");
      return;
    }

    console.log(`📋 Found ${brands.length} brands with USD pricing:`);
    brands.forEach(brand => {
      console.log(`   - ${brand.name} (${brand.location}): ${brand.price_range}`);
    });

    // Step 2: Convert USD pricing to Nigerian Naira
    console.log("\n🔧 Step 2: Converting USD pricing to Nigerian Naira...");
    
    let updatedCount = 0;
    let errorCount = 0;

    for (const brand of brands) {
      console.log(`\n🔧 Processing ${brand.name}:`);
      console.log(`   Current: ${brand.price_range}`);

      let newPriceRange = brand.price_range;

      // Convert USD to NGN (approximate rate: 1 USD = 1500 NGN)
      if (newPriceRange.includes("$")) {
        // Replace $ with ₦ and convert amounts
        newPriceRange = newPriceRange.replace(/\$/g, "₦");
        
        // Convert dollar amounts to Naira (multiply by 1500)
        newPriceRange = newPriceRange.replace(/(\d+)/g, (match, number) => {
          const nairaAmount = parseInt(number) * 1500;
          return nairaAmount.toLocaleString();
        });

        console.log(`   Converted: ${newPriceRange}`);
      }

      // Update the brand's price range
      const { error: updateError } = await supabase
        .from("brands")
        .update({ price_range: newPriceRange })
        .eq("id", brand.id);

      if (updateError) {
        console.error(`   ❌ Failed to update ${brand.name}:`, updateError);
        errorCount++;
      } else {
        console.log(`   ✅ Successfully updated ${brand.name}`);
        updatedCount++;
      }
    }

    // Step 3: Display results
    console.log("\n📊 Step 3: Results...");
    console.log(`✅ Updated brands: ${updatedCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    // Step 4: Verify the updates
    console.log("\n🔍 Step 4: Verifying updates...");
    const { data: updatedBrands, error: verifyError } = await supabase
      .from("brands")
      .select("name, price_range")
      .or("price_range.like.%₦%");

    if (verifyError) {
      console.error("❌ Error verifying brands:", verifyError);
    } else {
      console.log("✅ Verification completed");
      console.log("\n📋 Updated price ranges:");
      updatedBrands.forEach(brand => {
        console.log(`   - ${brand.name}: ${brand.price_range}`);
      });
    }

    console.log("\n======================================================================");
    console.log("🎯 USD pricing conversion completed!");
    console.log(`📊 Summary: ${updatedCount} brands updated, ${errorCount} errors`);
    console.log("🏁 Script completed");

  } catch (error) {
    console.error("❌ Script error:", error);
  }
}

// Run the script
fixUSDPricing();
