const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://gswduyodzdgucjscjtvz.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAxNzQzOCwiZXhwIjoyMDYzNTkzNDM4fQ.4sqZxnRlSXQwRv7wB5JEWcpdTr5_Ucb97IF-32SRG7k";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCurrentState() {
  try {
    console.log("🔍 Checking current state for eloka@culturin.com...\n");

    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role, owned_brands")
      .eq("email", "eloka@culturin.com")
      .single();

    if (profileError) {
      console.error("❌ Profile error:", profileError);
      return;
    }

    console.log("✅ Profile found:", profile);

    // Check if ehbs-couture brand exists
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name, category, location")
      .eq("id", "ehbs-couture")
      .single();

    if (brandError) {
      console.error("❌ Brand error:", brandError);
    } else {
      console.log("✅ Brand found:", brand);
    }

    // Check if user can access the brand
    const ownedBrands = profile.owned_brands || [];
    console.log("\n🔍 Brand access check:");
    console.log("  User owned_brands:", ownedBrands);
    console.log(
      "  Can access ehbs-couture:",
      ownedBrands.includes("ehbs-couture")
    );

    // Test the brand filtering logic
    console.log("\n🧪 Testing brand filtering logic:");

    // Get all brands
    const { data: allBrands, error: allBrandsError } = await supabase
      .from("brands")
      .select("id, name, category, location");

    if (allBrandsError) {
      console.error("❌ Error fetching all brands:", allBrandsError);
      return;
    }

    console.log(`  Total brands in database: ${allBrands.length}`);

    // Filter brands by ownership (simulate frontend logic)
    const filteredBrands = allBrands.filter((brand) =>
      ownedBrands.includes(brand.id)
    );

    console.log(`  Brands user should see: ${filteredBrands.length}`);

    if (filteredBrands.length > 0) {
      console.log("  Filtered brands:");
      filteredBrands.forEach((brand) => {
        console.log(`    - ${brand.name} (${brand.id})`);
      });
    } else {
      console.log("  ❌ No brands match the user's owned_brands array");
      console.log("  🔍 Let's check what brands exist with similar names:");

      const ehbsBrands = allBrands.filter(
        (brand) =>
          brand.name.toLowerCase().includes("ehbs") ||
          brand.name.toLowerCase().includes("couture")
      );

      if (ehbsBrands.length > 0) {
        console.log("  Brands with 'ehbs' or 'couture' in name:");
        ehbsBrands.forEach((brand) => {
          console.log(`    - ${brand.name} (${brand.id})`);
        });
      }
    }

    // Check permissions service logic
    console.log("\n🔍 Checking permissions service logic:");
    const BRAND_ADMIN_EMAILS = ["eloka@culturin.com"];
    const isBrandAdmin = BRAND_ADMIN_EMAILS.includes(profile.email);
    console.log(`  Is in BRAND_ADMIN_EMAILS: ${isBrandAdmin}`);
    console.log(`  Role is brand_admin: ${profile.role === "brand_admin"}`);
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

checkCurrentState();
