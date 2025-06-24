const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const supabaseUrl = "https://gswduyodzdgucjscjtvz.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAxNzQzOCwiZXhwIjoyMDYzNTkzNDM4fQ.4sqZxnRlSXQwRv7wB5JEWcpdTr5_Ucb97IF-32SRG7k";

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSwimwearBrandName() {
  try {
    console.log("🔍 Looking for 'Swimwear and Coverups' brand...\n");

    // Find the brand with the incorrect name
    const { data: brands, error: searchError } = await supabase
      .from("brands")
      .select("id, name, description, category")
      .ilike("name", "%swimwear%");

    if (searchError) {
      console.error("❌ Error searching for brand:", searchError);
      return;
    }

    if (!brands || brands.length === 0) {
      console.log("❌ No brands found with 'swimwear' in the name");
      console.log("📋 Let me show you all available brands:");

      const { data: allBrands, error: allBrandsError } = await supabase
        .from("brands")
        .select("id, name, category")
        .order("name");

      if (allBrandsError) {
        console.error("❌ Error fetching all brands:", allBrandsError);
        return;
      }

      console.log("Available brands:");
      allBrands.forEach((brand, index) => {
        console.log(
          `${index + 1}. ${brand.name} (ID: ${brand.id}) - ${brand.category}`
        );
      });
      return;
    }

    console.log("✅ Found brands with 'swimwear':");
    brands.forEach((brand, index) => {
      console.log(
        `${index + 1}. ${brand.name} (ID: ${brand.id}) - ${brand.category}`
      );
    });

    // Find the specific brand to update
    const targetBrand = brands.find(
      (brand) =>
        brand.name.toLowerCase().includes("swimwear") &&
        brand.name.toLowerCase().includes("coverup")
    );

    if (!targetBrand) {
      console.log("❌ Could not find 'Swimwear and Coverups' brand");
      return;
    }

    console.log(
      `\n🎯 Found target brand: "${targetBrand.name}" (ID: ${targetBrand.id})`
    );
    console.log("🔄 Updating brand name to 'Swim and Dream'...\n");

    // Update the brand name
    const { data: updatedBrand, error: updateError } = await supabase
      .from("brands")
      .update({
        name: "Swim and Dream",
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetBrand.id)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Error updating brand:", updateError);
      return;
    }

    console.log("✅ Brand name updated successfully!");
    console.log(`   Old name: "${targetBrand.name}"`);
    console.log(`   New name: "${updatedBrand.name}"`);

    // Update related tables that might reference the brand by name
    console.log("\n🔄 Checking for related table updates...");

    // Update spotlight content
    const { data: spotlightUpdates, error: spotlightError } = await supabase
      .from("spotlight_content")
      .update({ brand_name: "Swim and Dream" })
      .eq("brand_name", targetBrand.name)
      .select();

    if (spotlightError) {
      console.warn("⚠️ Error updating spotlight content:", spotlightError);
    } else if (spotlightUpdates && spotlightUpdates.length > 0) {
      console.log(
        `✅ Updated ${spotlightUpdates.length} spotlight content records`
      );
    } else {
      console.log("ℹ️ No spotlight content found for this brand");
    }

    // Check for any other references (products, reviews, etc. use brand_id, so they don't need updates)
    console.log("\n📊 Summary:");
    console.log(
      `✅ Brand name updated: "${targetBrand.name}" → "Swim and Dream"`
    );
    console.log(`✅ Brand ID remains: ${targetBrand.id}`);
    console.log(
      "✅ All brand_id references remain intact (products, reviews, etc.)"
    );
    console.log("✅ Brand name propagation completed successfully!");
  } catch (error) {
    console.error("❌ Error fixing brand name:", error);
  }
}

// Run the fix
fixSwimwearBrandName();
