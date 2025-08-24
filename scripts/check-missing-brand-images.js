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

async function checkMissingBrandImages() {
  try {
    console.log("🔍 Checking for brands with missing or placeholder images...");
    console.log("======================================================================");

    // Get all brands with their image information
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select(`
        id,
        name,
        image,
        location,
        created_at
      `)
      .order("name");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    console.log(`📋 Found ${brands.length} brands`);

    // Analyze brands for missing or placeholder images
    const brandsWithIssues = [];
    const brandsWithImages = [];

    brands.forEach(brand => {
      const hasImage = brand.image && 
                      brand.image.trim() !== "" && 
                      !brand.image.includes("placeholder") &&
                      !brand.image.includes("default") &&
                      !brand.image.includes("coming-soon");

      if (!hasImage) {
        brandsWithIssues.push({
          id: brand.id,
          name: brand.name,
          image: brand.image || "No image",
          location: brand.location || "Unknown",
          issue: !brand.image ? "Missing image" : "Placeholder/placeholder image"
        });
      } else {
        brandsWithImages.push({
          name: brand.name,
          image: brand.image.split("/").pop()
        });
      }
    });

    // Display results
    console.log("\n📊 Analysis Results:");
    console.log(`✅ Brands with proper images: ${brandsWithImages.length}`);
    console.log(`⚠️  Brands with missing/placeholder images: ${brandsWithIssues.length}`);

    if (brandsWithIssues.length > 0) {
      console.log("\n⚠️  Brands needing images:");
      brandsWithIssues.forEach((brand, index) => {
        console.log(`\n${index + 1}. ${brand.name}`);
        console.log(`   ID: ${brand.id}`);
        console.log(`   Location: ${brand.location}`);
        console.log(`   Current image: ${brand.image}`);
        console.log(`   Issue: ${brand.issue}`);
      });
    }

    if (brandsWithImages.length > 0) {
      console.log("\n✅ Brands with proper images (sample):");
      brandsWithImages.slice(0, 10).forEach(brand => {
        console.log(`   - ${brand.name}: ${brand.image}`);
      });
    }

    // Check if there are any brands with very long or suspicious image URLs
    console.log("\n🔍 Checking for suspicious image URLs...");
    const suspiciousBrands = brands.filter(brand => 
      brand.image && 
      (brand.image.length > 200 || 
       brand.image.includes("http://") ||
       brand.image.includes("data:"))
    );

    if (suspiciousBrands.length > 0) {
      console.log(`⚠️  Found ${suspiciousBrands.length} brands with suspicious image URLs:`);
      suspiciousBrands.forEach(brand => {
        console.log(`   - ${brand.name}: ${brand.image.substring(0, 100)}...`);
      });
    } else {
      console.log("✅ No suspicious image URLs found");
    }

    console.log("\n======================================================================");
    console.log("🎯 Brand image check completed!");
    console.log(`📊 Summary: ${brandsWithImages.length} with images, ${brandsWithIssues.length} need images`);
    console.log("🏁 Script completed");

  } catch (error) {
    console.error("❌ Script error:", error);
  }
}

// Run the script
checkMissingBrandImages();
