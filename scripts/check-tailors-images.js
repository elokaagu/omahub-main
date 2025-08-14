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

async function checkTailorsImages() {
  try {
    console.log("🔍 Checking tailor image accuracy...");

    // Get all tailors with their current images
    const { data: tailors, error: tailorsError } = await supabase
      .from("tailors")
      .select("id, title, brand_id, image, created_at")
      .order("title");

    if (tailorsError) {
      console.error("❌ Error fetching tailors:", tailorsError);
      return;
    }

    console.log(`📋 Found ${tailors.length} tailors`);

    // Get brand names for context
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    const brandMap = brands.reduce((acc, brand) => {
      acc[brand.id] = brand.name;
      return acc;
    }, {});

    // Analyze image patterns
    let uniqueImageCount = 0;
    const uniqueImages = new Set();
    const imageTailorMap = {};

    tailors.forEach((tailor) => {
      if (tailor.image) {
        uniqueImages.add(tailor.image);

        // Track which tailors use each image
        if (!imageTailorMap[tailor.image]) {
          imageTailorMap[tailor.image] = [];
        }
        imageTailorMap[tailor.image].push({
          id: tailor.id,
          title: tailor.title,
          brand: brandMap[tailor.brand_id] || "Unknown",
        });
      }
    });

    uniqueImageCount = uniqueImages.size;

    console.log(`\n📊 Image Analysis:`);
    console.log(`   🖼️ Unique images: ${uniqueImageCount}`);
    console.log(`   👔 Total tailors: ${tailors.length}`);
    console.log(`   🔄 Duplicate images: ${tailors.length - uniqueImageCount}`);

    // Show tailors with duplicate images
    const duplicates = Object.entries(imageTailorMap).filter(
      ([image, tailorList]) => tailorList.length > 1
    );
    if (duplicates.length > 0) {
      console.log(`\n🔄 Tailors with duplicate images:`);
      duplicates.forEach(([image, tailorList]) => {
        const filename = image.split("/").pop() || "";
        console.log(`\n   📸 Image: ${filename}`);
        console.log(`   🔗 URL: ${image}`);
        console.log(`   📋 Used by ${tailorList.length} tailors:`);
        tailorList.forEach((tailor) => {
          console.log(`      - ${tailor.title} (${tailor.brand})`);
        });
      });
    }

    // Show first few tailors with their images
    console.log(`\n📋 Sample tailor images (first 10):`);
    tailors.slice(0, 10).forEach((tailor) => {
      const brandName = brandMap[tailor.brand_id] || "Unknown";
      const filename = tailor.image
        ? tailor.image.split("/").pop()
        : "No image";
      console.log(`   - ${tailor.title} (${brandName}): ${filename}`);
    });

    console.log(`\n🎯 Tailor image check completed!`);
  } catch (error) {
    console.error("❌ Error in checkTailorsImages:", error);
  }
}

// Run the check
checkTailorsImages()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
