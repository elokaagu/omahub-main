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

async function forceRefreshBrands() {
  try {
    console.log("🔄 Force refreshing brand data...");

    // First, let's check if there are any brands with category changes
    const { data: brands, error } = await supabase
      .from("brands")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching brands:", error);
      return;
    }

    console.log(`📊 Total brands found: ${brands.length}\n`);

    // Check for any brands that might have been updated to Streetwear
    const potentialStreetwearBrands = brands.filter((brand) => {
      const category = brand.category?.toLowerCase() || "";
      return (
        category.includes("street") ||
        category.includes("urban") ||
        category.includes("casual") ||
        category.includes("ready")
      );
    });

    console.log("🔍 Brands that might be streetwear-related:");
    potentialStreetwearBrands.forEach((brand) => {
      console.log(
        `   - ${brand.name} -> "${brand.category}" (Updated: ${brand.updated_at})`
      );
    });
    console.log("");

    // Group by category and show counts
    const categoryCounts = {};
    brands.forEach((brand) => {
      const category = brand.category || "Uncategorized";
      if (!categoryCounts[category]) {
        categoryCounts[category] = 0;
      }
      categoryCounts[category]++;
    });

    console.log("📋 Current category breakdown:");
    Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([category, count]) => {
        const status = count >= 4 ? "✅" : "❌";
        console.log(`${status} ${category}: ${count} brands`);
      });

    // Check if Accessories has been updated
    const accessoriesBrands = brands.filter(
      (brand) => brand.category === "Accessories"
    );
    console.log(
      `\n👛 Accessories category: ${accessoriesBrands.length} brands`
    );
    accessoriesBrands.forEach((brand) => {
      console.log(
        `   - ${brand.name} (${brand.location}) - Updated: ${brand.updated_at}`
      );
    });

    // Check for any brands that might have been moved to Streetwear
    console.log(
      "\n🔍 Checking for any brands that might have been updated to Streetwear..."
    );
    const recentlyUpdated = brands.filter((brand) => {
      if (!brand.updated_at) return false;
      const updateDate = new Date(brand.updated_at);
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      return updateDate > oneDayAgo;
    });

    console.log(
      `📅 Brands updated in the last 24 hours: ${recentlyUpdated.length}`
    );
    recentlyUpdated.forEach((brand) => {
      console.log(
        `   - ${brand.name} -> "${brand.category}" (Updated: ${brand.updated_at})`
      );
    });

    // If you've updated brands in Studio, they should appear here
    console.log(
      "\n💡 If you updated brands in Studio but don't see them here:"
    );
    console.log("   1. Make sure the changes were saved in Studio");
    console.log('   2. Check if the category name is exactly "Streetwear"');
    console.log("   3. Try refreshing the Studio page and saving again");
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the function
forceRefreshBrands();
