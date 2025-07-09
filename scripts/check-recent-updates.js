require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentUpdates() {
  try {
    console.log("🔄 Checking for recent brand updates...");

    // Fetch all brands with updated_at field
    const { data: brands, error } = await supabase
      .from("brands")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching brands:", error);
      return;
    }

    console.log(`📊 Total brands found: ${brands.length}\n`);

    // Check for brands updated in the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentUpdates = brands.filter((brand) => {
      if (!brand.updated_at) return false;
      return new Date(brand.updated_at) > oneWeekAgo;
    });

    console.log(
      `📅 Brands updated in the last 7 days: ${recentUpdates.length}`
    );
    if (recentUpdates.length > 0) {
      recentUpdates.forEach((brand) => {
        console.log(
          `   - ${brand.name} (${brand.category}) - Updated: ${brand.updated_at}`
        );
      });
    }
    console.log("");

    // Look for any categories that might be similar to Streetwear
    const allCategories = [
      ...new Set(brands.map((brand) => brand.category).filter(Boolean)),
    ];
    console.log("🔍 All categories in database:");
    allCategories.forEach((category) => console.log(`   - "${category}"`));
    console.log("");

    // Check for any categories that might contain "street", "wear", "casual", etc.
    const streetwearRelated = allCategories.filter(
      (category) =>
        category.toLowerCase().includes("street") ||
        category.toLowerCase().includes("wear") ||
        category.toLowerCase().includes("casual") ||
        category.toLowerCase().includes("urban")
    );

    if (streetwearRelated.length > 0) {
      console.log("🎯 Categories that might be related to Streetwear:");
      streetwearRelated.forEach((category) => {
        const brandsInCategory = brands.filter(
          (brand) => brand.category === category
        );
        console.log(`   - "${category}" (${brandsInCategory.length} brands)`);
        brandsInCategory.forEach((brand) => {
          console.log(`     * ${brand.name}`);
        });
      });
    } else {
      console.log(
        '❌ No categories found that match "Streetwear" or similar terms'
      );
    }

    // Check Accessories category specifically
    const accessoriesBrands = brands.filter(
      (brand) => brand.category === "Accessories"
    );
    console.log(
      `\n👛 Accessories category: ${accessoriesBrands.length} brands`
    );
    accessoriesBrands.forEach((brand) => {
      console.log(`   - ${brand.name} (${brand.location})`);
    });

    // Show all brands with their categories for debugging
    console.log("\n📋 All brands with their categories:");
    brands.forEach((brand) => {
      console.log(`   ${brand.name} -> "${brand.category}"`);
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the function
checkRecentUpdates();
