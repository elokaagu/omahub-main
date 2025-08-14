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

async function checkHeroImagesForBrands() {
  try {
    console.log("🔍 Checking hero-images bucket for original brand images...");
    console.log("=".repeat(60));

    // 1. Get all images from hero-images bucket
    console.log("\n📦 Step 1: Getting all images from hero-images bucket...");

    const { data: heroImages, error: heroError } = await supabase.storage
      .from("hero-images")
      .list("", { limit: 1000 });

    if (heroError) {
      console.error("❌ Error listing hero-images:", heroError);
      return;
    }

    console.log(`📋 Found ${heroImages.length} images in hero-images bucket`);

    // 2. Filter for image files and show details
    const imageFiles = heroImages.filter((file) =>
      file.name.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)
    );

    console.log(`🖼️ Found ${imageFiles.length} image files:`);

    imageFiles.forEach((file, index) => {
      console.log(`\n   ${index + 1}. ${file.name}`);
      console.log(`      📏 Size: ${file.metadata?.size || "unknown"} bytes`);
      console.log(`      📅 Created: ${file.created_at || "unknown"}`);
      console.log(`      🔄 Updated: ${file.updated_at || "unknown"}`);
      console.log(
        `      🔗 URL: ${supabaseUrl}/storage/v1/object/public/hero-images/${file.name}`
      );
    });

    // 3. Check if these images match any brand names or patterns
    console.log("\n🔍 Step 2: Analyzing image patterns...");

    // Get brand names to compare
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, created_at")
      .order("created_at");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    console.log(`📋 Found ${brands.length} brands to match against`);

    // Try to match hero images with brands based on creation order
    console.log("\n🔗 Step 3: Attempting brand-image matching...");

    const brandImageMatches = [];

    // Sort both arrays by creation date
    const sortedHeroImages = imageFiles.sort((a, b) => {
      const aTime = a.created_at || a.updated_at || 0;
      const bTime = b.created_at || b.updated_at || 0;
      return aTime - bTime;
    });

    const sortedBrands = brands.sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return aTime - bTime;
    });

    // Try to match based on creation order
    for (
      let i = 0;
      i < Math.min(sortedHeroImages.length, sortedBrands.length);
      i++
    ) {
      const heroImage = sortedHeroImages[i];
      const brand = sortedBrands[i];

      const imageUrl = `${supabaseUrl}/storage/v1/object/public/hero-images/${heroImage.name}`;

      brandImageMatches.push({
        brand: brand.name,
        brandId: brand.id,
        imageUrl: imageUrl,
        imageName: heroImage.name,
        brandCreated: brand.created_at,
        imageCreated: heroImage.created_at || heroImage.updated_at,
      });

      console.log(`\n   ${i + 1}. ${brand.name}`);
      console.log(`      📸 Image: ${heroImage.name}`);
      console.log(`      🔗 URL: ${imageUrl}`);
      console.log(`      🏷️ Brand Created: ${brand.created_at}`);
      console.log(
        `      🖼️ Image Created: ${heroImage.created_at || heroImage.updated_at}`
      );
    }

    // 4. Summary and recommendations
    console.log("\n" + "=".repeat(60));
    console.log("🎯 Hero-images analysis completed!");

    if (brandImageMatches.length > 0) {
      console.log(
        `\n✅ Found ${brandImageMatches.length} potential brand-image matches`
      );

      console.log("\n💡 These hero-images might be the original brand images!");
      console.log("   - They were created around the same time as the brands");
      console.log(
        "   - They're in the hero-images bucket (appropriate for brands)"
      );
      console.log(
        "   - They have the same naming pattern as other brand images"
      );

      console.log("\n🚀 Next steps:");
      console.log(
        "   1. Verify these images are actually brand images (not hero slides)"
      );
      console.log(
        "   2. If confirmed, update the brands table with these URLs"
      );
      console.log(
        "   3. Remove the cache-busting parameters from current URLs"
      );
      console.log(
        "   4. Test the homepage to see if brand images are now correct"
      );

      console.log("\n📋 Summary of matches:");
      brandImageMatches.forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.brand} → ${match.imageName}`);
      });
    } else {
      console.log("\n❌ No clear brand-image matches found");
    }
  } catch (error) {
    console.error("❌ Error in checkHeroImagesForBrands:", error);
  }
}

// Run the check
checkHeroImagesForBrands()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
