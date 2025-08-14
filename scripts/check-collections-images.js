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

async function checkCollectionsImages() {
  try {
    console.log("🔍 Checking collections/catalogues image accuracy...");

    // Try to access the catalogues table
    const { data: catalogues, error: cataloguesError } = await supabase
      .from("catalogues")
      .select("id, title, brand_id, image, created_at")
      .order("title");

    if (cataloguesError) {
      console.error("❌ Error fetching catalogues:", cataloguesError);
      console.log("🔄 Catalogues table might not exist");
      return;
    }

    console.log(`📋 Found ${catalogues.length} catalogues`);

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
    const imageCatalogueMap = {};

    catalogues.forEach((catalogue) => {
      if (catalogue.image) {
        uniqueImages.add(catalogue.image);

        // Track which catalogues use each image
        if (!imageCatalogueMap[catalogue.image]) {
          imageCatalogueMap[catalogue.image] = [];
        }
        imageCatalogueMap[catalogue.image].push({
          id: catalogue.id,
          title: catalogue.title,
          brand: brandMap[catalogue.brand_id] || "Unknown",
        });
      }
    });

    uniqueImageCount = uniqueImages.size;

    console.log(`\n📊 Image Analysis:`);
    console.log(`   🖼️ Unique images: ${uniqueImageCount}`);
    console.log(`   📚 Total catalogues: ${catalogues.length}`);
    console.log(
      `   🔄 Duplicate images: ${catalogues.length - uniqueImageCount}`
    );

    // Show catalogues with duplicate images
    const duplicates = Object.entries(imageCatalogueMap).filter(
      ([image, catalogueList]) => catalogueList.length > 1
    );
    if (duplicates.length > 0) {
      console.log(`\n🔄 Catalogues with duplicate images:`);
      duplicates.forEach(([image, catalogueList]) => {
        const filename = image.split("/").pop() || "";
        console.log(`\n   📸 Image: ${filename}`);
        console.log(`   🔗 URL: ${image}`);
        console.log(`   📋 Used by ${catalogueList.length} catalogues:`);
        catalogueList.forEach((catalogue) => {
          console.log(`      - ${catalogue.title} (${catalogue.brand})`);
        });
      });
    }

    // Show first few catalogues with their images
    console.log(`\n📋 Sample catalogue images (first 10):`);
    catalogues.slice(0, 10).forEach((catalogue) => {
      const brandName = brandMap[catalogue.brand_id] || "Unknown";
      const filename = catalogue.image
        ? catalogue.image.split("/").pop()
        : "No image";
      console.log(`   - ${catalogue.title} (${brandName}): ${filename}`);
    });

    console.log(`\n🎯 Collections/catalogues image check completed!`);
  } catch (error) {
    console.error("❌ Error in checkCollectionsImages:", error);
  }
}

// Run the check
checkCollectionsImages()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
