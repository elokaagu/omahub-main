const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const supabaseUrl = "https://gswduyodzdgucjscjtvz.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAxNzQzOCwiZXhwIjoyMDYzNTkzNDM4fQ.4sqZxnRlSXQwRv7wB5JEWcpdTr5_Ucb97IF-32SRG7k";

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCategoryCounts() {
  try {
    console.log("🔍 Checking brand counts by category...\n");

    // Get all brands
    const { data: brands, error } = await supabase
      .from("brands")
      .select("id, name, category")
      .order("category", { ascending: true });

    if (error) {
      console.error("❌ Error fetching brands:", error);
      return;
    }

    // Group brands by category
    const categoryGroups = {};
    brands.forEach((brand) => {
      const category = brand.category || "Uncategorized";
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(brand);
    });

    // Sort categories by brand count (descending)
    const sortedCategories = Object.entries(categoryGroups).sort(
      ([, a], [, b]) => b.length - a.length
    );

    console.log("📊 Brand counts by category:\n");
    console.log("Category".padEnd(25) + "Count".padEnd(8) + "Status");
    console.log("-".repeat(50));

    sortedCategories.forEach(([category, brands]) => {
      const count = brands.length;
      let status = "";

      if (count >= 4) {
        status = "✅ Should have own row";
      } else if (count >= 2) {
        status = "⚠️  Might qualify";
      } else {
        status = "❌ Too few brands";
      }

      console.log(category.padEnd(25) + count.toString().padEnd(8) + status);
    });

    console.log("\n" + "=".repeat(50));
    console.log("📋 Categories with 4+ brands (should have distinct rows):");

    const categoriesWithEnoughBrands = sortedCategories.filter(
      ([, brands]) => brands.length >= 4
    );

    if (categoriesWithEnoughBrands.length === 0) {
      console.log("❌ No categories have 4 or more brands");
    } else {
      categoriesWithEnoughBrands.forEach(([category, brands], index) => {
        console.log(`${index + 1}. ${category} (${brands.length} brands)`);

        // Show first few brand names as examples
        const exampleBrands = brands
          .slice(0, 3)
          .map((b) => b.name)
          .join(", ");
        console.log(
          `   Examples: ${exampleBrands}${brands.length > 3 ? "..." : ""}`
        );
      });
    }

    console.log("\n" + "=".repeat(50));
    console.log("🏠 Current homepage categories:");
    const currentCategories = ["Bridal", "Ready to Wear", "Accessories"];

    currentCategories.forEach((category) => {
      const categoryData = categoryGroups[category];
      if (categoryData) {
        console.log(`✅ ${category}: ${categoryData.length} brands`);
      } else {
        console.log(`❌ ${category}: 0 brands (not found)`);
      }
    });

    console.log("\n" + "=".repeat(50));
    console.log("💡 Recommendations:");

    const missingCategories = categoriesWithEnoughBrands.filter(
      ([category]) => !currentCategories.includes(category)
    );

    if (missingCategories.length > 0) {
      console.log("📝 Categories that should be added to homepage:");
      missingCategories.forEach(([category, brands], index) => {
        console.log(`${index + 1}. ${category} (${brands.length} brands)`);
      });
    } else {
      console.log("✅ All categories with 4+ brands are already on homepage");
    }
  } catch (error) {
    console.error("❌ Error checking category counts:", error);
  }
}

// Run the check
checkCategoryCounts();
