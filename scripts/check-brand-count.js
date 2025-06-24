const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBrandCount() {
  try {
    console.log("🔍 Checking brand count in database...");

    // Get total count
    const { count, error: countError } = await supabase
      .from("brands")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("❌ Error getting brand count:", countError);
      return;
    }

    console.log(`📊 Total brands in database: ${count}`);

    // Get all brands
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, category, location, is_verified")
      .order("name");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    console.log(`✅ Successfully fetched ${brands.length} brands:`);
    brands.forEach((brand, index) => {
      console.log(
        `${index + 1}. ${brand.name} (${brand.category}) - ${brand.location} ${brand.is_verified ? "✓" : ""}`
      );
    });

    // Check categories
    const categories = [...new Set(brands.map((b) => b.category))];
    console.log("\n📋 Categories found:", categories);

    // Check locations
    const locations = [...new Set(brands.map((b) => b.location))];
    console.log("🌍 Locations found:", locations);
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

checkBrandCount();
