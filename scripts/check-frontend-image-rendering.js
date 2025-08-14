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

async function checkFrontendImageRendering() {
  try {
    console.log("🔍 Checking frontend image rendering logic...");
    console.log("=".repeat(60));

    // 1. Check if there are any brands with missing location data
    console.log(
      "\n📊 STEP 1: Checking for missing data that might cause rendering issues"
    );
    console.log("-".repeat(50));

    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image, location, category, is_verified, rating")
      .order("name");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    // Check for brands with missing location
    const brandsWithMissingLocation = brands.filter((b) => !b.location);
    if (brandsWithMissingLocation.length > 0) {
      console.log(
        `⚠️ Found ${brandsWithMissingLocation.length} brands with missing location:`
      );
      brandsWithMissingLocation.forEach((b) => console.log(`   - ${b.name}`));
    } else {
      console.log("✅ All brands have location data");
    }

    // Check for brands with missing rating
    const brandsWithMissingRating = brands.filter((b) => !b.rating);
    if (brandsWithMissingRating.length > 0) {
      console.log(
        `⚠️ Found ${brandsWithMissingRating.length} brands with missing rating:`
      );
      brandsWithMissingRating.forEach((b) => console.log(`   - ${b.name}`));
    } else {
      console.log("✅ All brands have rating data");
    }

    // Check for brands with missing verification status
    const brandsWithMissingVerification = brands.filter(
      (b) => b.is_verified === null || b.is_verified === undefined
    );
    if (brandsWithMissingVerification.length > 0) {
      console.log(
        `⚠️ Found ${brandsWithMissingVerification.length} brands with missing verification status:`
      );
      brandsWithMissingVerification.forEach((b) =>
        console.log(`   - ${b.name}`)
      );
    } else {
      console.log("✅ All brands have verification status");
    }

    // 2. Simulate the exact data transformation that happens in HomeContent.tsx
    console.log("\n📊 STEP 2: Simulating HomeContent.tsx data transformation");
    console.log("-".repeat(50));

    // This is the exact logic from HomeContent.tsx lines 470-490
    const transformedBrands = brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      image: brand.image || "/placeholder-image.jpg",
      location: brand.location?.split(",")[0] || "Unknown", // Take just the city name
      rating: brand.rating,
      isVerified: brand.is_verified || false,
      category: brand.category,
      video_url: brand.video_url || undefined,
      video_thumbnail: brand.video_thumbnail || undefined,
    }));

    console.log(
      `📋 Transformed ${transformedBrands.length} brands for frontend:`
    );

    // Show first 5 transformed brands
    transformedBrands.slice(0, 5).forEach((brand, index) => {
      console.log(`\n   ${index + 1}. ${brand.name}`);
      console.log(`      📸 Image: ${brand.image}`);
      console.log(`      📍 Location: ${brand.location}`);
      console.log(`      ⭐ Rating: ${brand.rating}`);
      console.log(`      ✅ Verified: ${brand.isVerified}`);
      console.log(`      🏷️ Category: ${brand.category}`);
    });

    // 3. Check for any data inconsistencies that might cause rendering issues
    console.log("\n📊 STEP 3: Checking for data inconsistencies");
    console.log("-".repeat(50));

    let inconsistencies = 0;

    // Check for brands that might cause rendering issues
    const problematicBrands = transformedBrands.filter((b) => {
      // Check if image is missing or placeholder
      if (!b.image || b.image.includes("placeholder")) {
        return true;
      }

      // Check if location is "Unknown"
      if (b.location === "Unknown") {
        return true;
      }

      // Check if rating is missing
      if (!b.rating) {
        return true;
      }

      return false;
    });

    if (problematicBrands.length > 0) {
      console.log(
        `⚠️ Found ${problematicBrands.length} brands that might cause rendering issues:`
      );
      problematicBrands.forEach((b) => {
        console.log(`   - ${b.name}:`);
        if (!b.image || b.image.includes("placeholder"))
          console.log(`     ❌ Missing/placeholder image`);
        if (b.location === "Unknown") console.log(`     ❌ Missing location`);
        if (!b.rating) console.log(`     ❌ Missing rating`);
      });
      inconsistencies++;
    }

    // 4. Check if there are any image URL format issues
    console.log("\n📊 STEP 4: Checking image URL formats");
    console.log("-".repeat(50));

    const imageUrlIssues = transformedBrands.filter((b) => {
      if (!b.image || b.image.includes("placeholder")) return false;

      try {
        const url = new URL(b.image);
        // Check if the URL has the expected Supabase format
        if (!url.host.includes("supabase.co")) {
          return true;
        }
        return false;
      } catch {
        return true; // Invalid URL
      }
    });

    if (imageUrlIssues.length > 0) {
      console.log(
        `⚠️ Found ${imageUrlIssues.length} brands with unexpected image URL formats:`
      );
      imageUrlIssues.forEach((b) => console.log(`   - ${b.name}: ${b.image}`));
      inconsistencies++;
    } else {
      console.log("✅ All image URLs have expected Supabase format");
    }

    // 5. Summary
    console.log("\n" + "=".repeat(60));
    console.log("🎯 Frontend image rendering check completed!");

    if (inconsistencies === 0) {
      console.log(
        "\n✅ No data inconsistencies found that would cause rendering issues"
      );
      console.log("💡 The issue might be:");
      console.log("   1. JavaScript errors in the browser console");
      console.log("   2. CSS/styling issues hiding the images");
      console.log("   3. Component rendering logic problems");
      console.log("   4. Network/CORS issues in the browser");
    } else {
      console.log(`\n⚠️ Found ${inconsistencies} potential data issues`);
    }

    console.log("\n🔍 Next debugging steps:");
    console.log("   1. Check browser console for JavaScript errors");
    console.log("   2. Check Network tab for failed image requests");
    console.log("   3. Check if images are loading but hidden by CSS");
    console.log("   4. Verify the exact error message you're seeing");
  } catch (error) {
    console.error("❌ Error in checkFrontendImageRendering:", error);
  }
}

// Run the check
checkFrontendImageRendering()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
