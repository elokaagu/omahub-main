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

async function listBrandsByCategory() {
  try {
    console.log("🔄 Fetching all brands...");

    // Fetch all brands
    const { data: brands, error } = await supabase
      .from("brands")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching brands:", error);
      return;
    }

    console.log(`📊 Total brands found: ${brands.length}\n`);

    // Group brands by category
    const categoryBrands = {};
    brands.forEach((brand) => {
      const category = brand.category || "Uncategorized";
      if (!categoryBrands[category]) {
        categoryBrands[category] = [];
      }
      categoryBrands[category].push({
        name: brand.name,
        location: brand.location,
        isVerified: brand.is_verified,
        id: brand.id,
      });
    });

    // Display each category with its brands
    Object.entries(categoryBrands)
      .sort(([, a], [, b]) => b.length - a.length) // Sort by number of brands
      .forEach(([category, brandList]) => {
        const status = brandList.length >= 4 ? "✅" : "❌";
        console.log(`${status} ${category} (${brandList.length} brands):`);

        brandList.forEach((brand, index) => {
          const verifiedIcon = brand.isVerified ? "✓" : " ";
          console.log(
            `   ${index + 1}. ${brand.name} ${verifiedIcon} (${brand.location})`
          );
        });
        console.log("");
      });

    // Summary
    const categoriesWith4Plus = Object.entries(categoryBrands)
      .filter(([, brands]) => brands.length >= 4)
      .map(([category]) => category);

    console.log("🎯 SUMMARY:");
    console.log(`Categories with 4+ brands: ${categoriesWith4Plus.length}`);
    console.log("Categories that will show on homepage:", categoriesWith4Plus);
    console.log("");

    // Categories needing more brands
    const categoriesNeedingMore = Object.entries(categoryBrands)
      .filter(([, brands]) => brands.length > 0 && brands.length < 4)
      .map(([category, brands]) => ({
        category,
        count: brands.length,
        needed: 4 - brands.length,
      }));

    if (categoriesNeedingMore.length > 0) {
      console.log("⚠️ Categories needing more brands to reach 4+ threshold:");
      categoriesNeedingMore.forEach(({ category, count, needed }) => {
        console.log(`   ${category}: ${count} brands (needs ${needed} more)`);
      });
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the function
listBrandsByCategory();
