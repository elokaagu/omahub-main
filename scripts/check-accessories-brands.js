const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const supabaseUrl = "https://gswduyodzdgucjscjtvz.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAxNzQzOCwiZXhwIjoyMDYzNTkzNDM4fQ.4sqZxnRlSXQwRv7wB5JEWcpdTr5_Ucb97IF-32SRG7k";

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAccessoriesBrands() {
  try {
    console.log("🔍 Checking accessories brands...\n");

    // Check for exact "Accessories" category
    const { data: exactMatch, error: exactError } = await supabase
      .from("brands")
      .select("id, name, category")
      .eq("category", "Accessories");

    if (exactError) {
      console.error("❌ Error fetching exact accessories:", exactError);
    } else {
      console.log(
        `📊 Brands with exact "Accessories" category: ${exactMatch.length}`
      );
      exactMatch.forEach((brand) => {
        console.log(`  - ${brand.name} (ID: ${brand.id})`);
      });
    }

    // Check for case-insensitive accessories
    const { data: caseInsensitive, error: caseError } = await supabase
      .from("brands")
      .select("id, name, category")
      .ilike("category", "%accessories%");

    if (caseError) {
      console.error(
        "❌ Error fetching case-insensitive accessories:",
        caseError
      );
    } else {
      console.log(
        `\n📊 Brands with "accessories" (case-insensitive): ${caseInsensitive.length}`
      );
      caseInsensitive.forEach((brand) => {
        console.log(
          `  - ${brand.name} (ID: ${brand.id}) - Category: "${brand.category}"`
        );
      });
    }

    // Check for specific brand names we added
    const accessoryBrandNames = [
      "Beads by Nneka",
      "Marrakech Textiles",
      "Kente Collective",
      "Shekudo",
      "Sahel Leatherworks",
    ];

    console.log(`\n🔍 Checking for specific accessory brands we added:`);

    for (const brandName of accessoryBrandNames) {
      const { data: brandData, error: brandError } = await supabase
        .from("brands")
        .select("id, name, category")
        .eq("name", brandName);

      if (brandError) {
        console.error(`❌ Error checking ${brandName}:`, brandError);
      } else if (brandData.length > 0) {
        const brand = brandData[0];
        console.log(`  ✅ ${brand.name} - Category: "${brand.category}"`);
      } else {
        console.log(`  ❌ ${brandName} - Not found`);
      }
    }
  } catch (error) {
    console.error("❌ Error checking accessories brands:", error);
  }
}

// Run the check
checkAccessoriesBrands();
