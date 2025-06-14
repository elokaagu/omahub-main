const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const supabaseUrl = "https://gswduyodzdgucjscjtvz.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAxNzQzOCwiZXhwIjoyMDYzNTkzNDM4fQ.4sqZxnRlSXQwRv7wB5JEWcpdTr5_Ucb97IF-32SRG7k";

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Brands to delete (test brands that were added for demo purposes)
const brandsToDelete = [
  "kente-collective",
  "marrakech-textiles",
  "beads-by-nneka",
];

async function deleteAccessoriesBrands() {
  try {
    console.log("🗑️  Deleting test accessories brands...\n");

    for (const brandId of brandsToDelete) {
      console.log(`Deleting brand: ${brandId}`);

      // First check if brand exists
      const { data: brand, error: fetchError } = await supabase
        .from("brands")
        .select("name")
        .eq("id", brandId)
        .single();

      if (fetchError) {
        console.log(`   ⚠️  Brand ${brandId} not found or already deleted`);
        continue;
      }

      // Delete the brand
      const { error: deleteError } = await supabase
        .from("brands")
        .delete()
        .eq("id", brandId);

      if (deleteError) {
        console.error(`   ❌ Error deleting ${brandId}:`, deleteError);
      } else {
        console.log(`   ✅ Successfully deleted: ${brand.name}`);
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("🔍 Checking remaining accessories brands...\n");

    // Check what's left
    const { data: remainingBrands, error } = await supabase
      .from("brands")
      .select("id, name, category")
      .eq("category", "Accessories")
      .order("name");

    if (error) {
      console.error("❌ Error fetching remaining brands:", error);
      return;
    }

    if (remainingBrands.length === 0) {
      console.log("✅ No accessories brands remaining");
    } else {
      console.log(`📊 ${remainingBrands.length} accessories brands remaining:`);
      remainingBrands.forEach((brand, index) => {
        console.log(`${index + 1}. ${brand.name} (${brand.id})`);
      });
    }
  } catch (error) {
    console.error("❌ Error in deletion process:", error);
  }
}

// Run the deletion
deleteAccessoriesBrands();
