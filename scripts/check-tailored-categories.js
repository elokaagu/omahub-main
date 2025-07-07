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

async function checkTailoredCategories() {
  console.log("🔍 Checking Tailored Categories for Tailored Dropdown...\n");

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

    // Check which Tailored dropdown items should be visible
    console.log("\n🔍 Tailored Dropdown Analysis:");

    const tailoredCategories = [
      "Bridal",
      "Custom Design",
      "Evening Gowns",
      "Alterations",
      "Tailored",
      "Event Wear",
      "Wedding Guest",
      "Birthday",
    ];

    const visibleItems = [];
    const missingItems = [];

    tailoredCategories.forEach((category) => {
      const count = categoryCounts[category] || 0;
      if (count > 0) {
        visibleItems.push(`${category} (${count} brands)`);
      } else {
        missingItems.push(category);
      }
    });

    console.log("\n✅ Visible in Tailored Dropdown:");
    if (visibleItems.length > 0) {
      visibleItems.forEach((item) => console.log(`  • ${item}`));
    } else {
      console.log("  None - no brands in tailored categories");
    }

    console.log("\n❌ Missing from Tailored Dropdown:");
    if (missingItems.length > 0) {
      missingItems.forEach((item) => console.log(`  • ${item}`));
    } else {
      console.log("  None - all categories have brands!");
    }

    // Show solution
    if (missingItems.length > 0) {
      console.log("\n🎯 SOLUTION:");
      console.log("To show all Tailored dropdown options, you need to:");
      console.log("1. Add brands to the missing categories, OR");
      console.log("2. Run: node scripts/add-missing-tailored-categories.js");
      console.log("   This will add sample brands to missing categories");
    } else {
      console.log("\n🎉 All Tailored dropdown items should be visible!");
      console.log("If you still don't see them, try refreshing your browser.");
    }

    // Show current tailored vs non-tailored categories
    console.log("\n📋 Category Classification:");

    console.log("\n🔧 Tailored Categories:");
    tailoredCategories.forEach((category) => {
      const count = categoryCounts[category] || 0;
      const status = count > 0 ? "✅" : "❌";
      console.log(`  ${status} ${category} (${count} brands)`);
    });

    const otherCategories = Object.keys(categoryCounts).filter(
      (cat) => !tailoredCategories.includes(cat)
    );
    if (otherCategories.length > 0) {
      console.log("\n📦 Other Categories (for Collections dropdown):");
      otherCategories.forEach((category) => {
        console.log(`  • ${category} (${categoryCounts[category]} brands)`);
      });
    }

    // Show brands by tailored category for reference
    console.log("\n📋 Brands by Tailored Category:");
    tailoredCategories.forEach((category) => {
      const count = categoryCounts[category] || 0;
      if (count > 0) {
        console.log(`\n${category} (${count} brands):`);
        const categoryBrands = brands.filter((b) => b.category === category);
        categoryBrands.forEach((brand) => {
          console.log(`  • ${brand.name}`);
        });
      }
    });
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

checkTailoredCategories();
