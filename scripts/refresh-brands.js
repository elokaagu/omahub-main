require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  console.log(
    "Available env vars:",
    Object.keys(process.env).filter((key) => key.includes("SUPABASE"))
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function refreshBrandsAndCheckCategories() {
  try {
    console.log("🔄 Refreshing brands data...");

    // Fetch all brands
    const { data: brands, error } = await supabase
      .from("brands")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching brands:", error);
      return;
    }

    console.log(`📊 Total brands found: ${brands.length}`);

    // Group brands by category
    const categoryCounts = {};
    brands.forEach((brand) => {
      const category = brand.category || "Uncategorized";
      if (!categoryCounts[category]) {
        categoryCounts[category] = 0;
      }
      categoryCounts[category]++;
    });

    // Display category counts
    console.log("\n📋 Category breakdown:");
    Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([category, count]) => {
        const status = count >= 4 ? "✅" : "❌";
        console.log(`${status} ${category}: ${count} brands`);
      });

    // Count categories with 4+ brands
    const categoriesWith4Plus = Object.entries(categoryCounts)
      .filter(([, count]) => count >= 4)
      .map(([category]) => category);

    console.log(
      `\n🎯 Categories with 4+ brands: ${categoriesWith4Plus.length}`
    );
    console.log("Categories that will show on homepage:", categoriesWith4Plus);

    // Check if we need to add more brands to reach 4+ threshold
    const categoriesNeedingMore = Object.entries(categoryCounts)
      .filter(([, count]) => count > 0 && count < 4)
      .map(([category, count]) => ({ category, count, needed: 4 - count }));

    if (categoriesNeedingMore.length > 0) {
      console.log("\n⚠️ Categories needing more brands to reach 4+ threshold:");
      categoriesNeedingMore.forEach(({ category, count, needed }) => {
        console.log(`   ${category}: ${count} brands (needs ${needed} more)`);
      });
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the function
refreshBrandsAndCheckCategories();
