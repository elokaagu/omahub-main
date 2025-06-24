const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const supabaseUrl = "https://gswduyodzdgucjscjtvz.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAxNzQzOCwiZXhwIjoyMDYzNTkzNDM4fQ.4sqZxnRlSXQwRv7wB5JEWcpdTr5_Ucb97IF-32SRG7k";

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCurrentAccessories() {
  try {
    console.log("🔍 Checking current accessories brands in database...\n");

    // Get all accessories brands
    const { data: accessories, error } = await supabase
      .from("brands")
      .select("*")
      .eq("category", "Accessories")
      .order("name");

    if (error) {
      console.error("❌ Error fetching accessories:", error);
      return;
    }

    console.log(`📊 Found ${accessories.length} accessories brands:\n`);

    accessories.forEach((brand, index) => {
      console.log(`${index + 1}. ${brand.name}`);
      console.log(`   ID: ${brand.id}`);
      console.log(`   Category: ${brand.category}`);
      console.log(`   Location: ${brand.location || "Not specified"}`);
      console.log(`   Rating: ${brand.rating || "Not rated"}`);
      console.log(
        `   Created: ${new Date(brand.created_at).toLocaleDateString()}`
      );
      console.log(`   Image: ${brand.image || "No image"}`);
      console.log("");
    });

    // Check for specific brands that might need to be deleted
    const potentiallyDeletedBrands = [
      "Kente Collective",
      "Marrakech Textiles",
      "Beads by Nneka",
      "Shekudo",
    ];

    console.log("🔍 Checking for potentially deleted brands:");
    potentiallyDeletedBrands.forEach((brandName) => {
      const found = accessories.find((brand) => brand.name === brandName);
      if (found) {
        console.log(`❌ ${brandName} - STILL EXISTS (ID: ${found.id})`);
      } else {
        console.log(`✅ ${brandName} - Not found (properly deleted)`);
      }
    });
  } catch (error) {
    console.error("❌ Error checking accessories:", error);
  }
}

// Run the check
checkCurrentAccessories();
