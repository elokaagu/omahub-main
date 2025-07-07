const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  console.log("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBrandCategories() {
  console.log("🔍 Checking Brand Categories for Collections Dropdown...\n");

  try {
    // Get all brands with their categories
    const { data: brands, error } = await supabase
      .from("brands")
      .select("id, name, category")
      .not("category", "is", null)
      .order("category");

    if (error) {
      console.error("❌ Error fetching brands:", error);
      return;
    }

    console.log(`Found ${brands.length} brands with categories\n`);

    // Count brands by category
    const categoryCounts = {};
    brands.forEach((brand) => {
      categoryCounts[brand.category] =
        (categoryCounts[brand.category] || 0) + 1;
    });

    console.log("📊 Current Brand Categories:");
    Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} brands`);
      });

    // Check which Collections dropdown items should be visible
    console.log("\n🔍 Collections Dropdown Analysis:");

    const collectionsMapping = {
      "High-End Fashion Brands": ["Luxury"],
      "Ready to Wear": ["Ready to Wear", "Casual Wear", "Vacation"],
      "Made to Measure": ["Couture", "Formal Wear"],
      "Streetwear & Urban": ["Streetwear"],
      Accessories: ["Accessories", "Jewelry"],
    };

    const visibleItems = [];
    const missingItems = [];

    Object.entries(collectionsMapping).forEach(([displayName, categories]) => {
      const totalCount = categories.reduce(
        (sum, cat) => sum + (categoryCounts[cat] || 0),
        0
      );
      if (totalCount > 0) {
        visibleItems.push(`${displayName} (${totalCount} brands)`);
      } else {
        missingItems.push(
          `${displayName} (needs brands in: ${categories.join(", ")})`
        );
      }
    });

    console.log("\n✅ Visible in Collections Dropdown:");
    if (visibleItems.length > 0) {
      visibleItems.forEach((item) => console.log(`  • ${item}`));
    } else {
      console.log("  None - no brands in collection categories");
    }

    console.log("\n❌ Missing from Collections Dropdown:");
    if (missingItems.length > 0) {
      missingItems.forEach((item) => console.log(`  • ${item}`));
    } else {
      console.log("  None - all categories have brands!");
    }

    // Show solution
    if (missingItems.length > 0) {
      console.log("\n🎯 SOLUTION:");
      console.log("To show all Collections dropdown options, you need to:");
      console.log("1. Add brands to the missing categories, OR");
      console.log("2. Run: node scripts/add-missing-collection-categories.js");
      console.log("   This will add sample brands to missing categories");
    } else {
      console.log("\n🎉 All Collections dropdown items should be visible!");
      console.log("If you still don't see them, try refreshing your browser.");
    }

    // Show brands by category for reference
    console.log("\n📋 Brands by Category:");
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`\n${category} (${count} brands):`);
      const categoryBrands = brands.filter((b) => b.category === category);
      categoryBrands.forEach((brand) => {
        console.log(`  • ${brand.name}`);
      });
    });
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

checkBrandCategories();
