const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const supabaseUrl = "https://gswduyodzdgucjscjtvz.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAxNzQzOCwiZXhwIjoyMDYzNTkzNDM4fQ.4sqZxnRlSXQwRv7wB5JEWcpdTr5_Ucb97IF-32SRG7k";

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeBrandOwner() {
  try {
    console.log("🔍 Searching for user: eloka@culturin.com");

    // First, check if user exists
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id, email, role, owned_brands")
      .eq("email", "eloka@culturin.com")
      .single();

    if (userError) {
      console.error("❌ Error finding user:", userError);
      return;
    }

    if (!user) {
      console.log("❌ User not found: eloka@culturin.com");
      return;
    }

    console.log("✅ User found:", user);

    // Search specifically for "Ehbs Couture" brand
    console.log("🔍 Searching for brand: Ehbs Couture");

    const { data: brands, error: brandError } = await supabase
      .from("brands")
      .select("id, name, category, location")
      .ilike("name", "%ehbs%couture%");

    if (brandError) {
      console.error("❌ Error finding brand:", brandError);
      return;
    }

    if (!brands || brands.length === 0) {
      console.log('❌ No brands found matching "Ehbs Couture"');
      console.log("📋 Let me show you all available brands:");

      const { data: allBrands, error: allBrandsError } = await supabase
        .from("brands")
        .select("id, name, category, location")
        .order("name");

      if (allBrandsError) {
        console.error("❌ Error fetching all brands:", allBrandsError);
        return;
      }

      console.log("Available brands:");
      allBrands.forEach((brand, index) => {
        console.log(
          `${index + 1}. ${brand.name} (ID: ${brand.id}) - ${brand.category} - ${brand.location}`
        );
      });
      return;
    }

    console.log("✅ Found brands:", brands);

    // Find the exact "Ehbs Couture" brand
    const targetBrand =
      brands.find(
        (brand) =>
          brand.name.toLowerCase().includes("ehbs") &&
          brand.name.toLowerCase().includes("couture")
      ) || brands[0];

    console.log(`🎯 Using brand: ${targetBrand.name} (ID: ${targetBrand.id})`);

    // Check if the brand ID is already a UUID or needs conversion
    let brandIdToUse = targetBrand.id;

    // If the ID is not a UUID format, we need to handle it differently
    // For now, let's check what type of ID we're dealing with
    console.log(
      `🔍 Brand ID type: ${typeof targetBrand.id}, value: "${targetBrand.id}"`
    );

    // Update user to be brand_admin and add brand to owned_brands
    console.log("🔄 Updating user role and brand ownership...");

    const currentOwnedBrands = user.owned_brands || [];

    // Check if brand is already owned
    if (currentOwnedBrands.includes(brandIdToUse)) {
      console.log("ℹ️ User already owns this brand");
    }

    const newOwnedBrands = currentOwnedBrands.includes(brandIdToUse)
      ? currentOwnedBrands
      : [...currentOwnedBrands, brandIdToUse];

    const { data: updatedUser, error: updateError } = await supabase
      .from("profiles")
      .update({
        role: "brand_admin",
        owned_brands: newOwnedBrands,
      })
      .eq("email", "eloka@culturin.com")
      .select()
      .single();

    if (updateError) {
      console.error("❌ Error updating user:", updateError);

      // Let's try a different approach - check the actual schema
      console.log("🔍 Let me check the profiles table schema...");
      const { data: schema, error: schemaError } = await supabase.rpc(
        "get_table_schema",
        { table_name: "profiles" }
      );

      if (!schemaError) {
        console.log("📋 Profiles table schema:", schema);
      }

      return;
    }

    console.log("✅ User updated successfully:", updatedUser);

    // Verify the update
    console.log("🔍 Verifying the update...");

    const { data: verification, error: verifyError } = await supabase
      .from("profiles")
      .select(
        `
        id, 
        email, 
        role, 
        owned_brands
      `
      )
      .eq("email", "eloka@culturin.com")
      .single();

    if (verifyError) {
      console.error("❌ Error verifying update:", verifyError);
      return;
    }

    console.log("✅ Final verification:");
    console.log(`   User: ${verification.email}`);
    console.log(`   Role: ${verification.role}`);
    console.log(`   Owned Brands: ${verification.owned_brands}`);

    // Get brand names for owned brands
    if (verification.owned_brands && verification.owned_brands.length > 0) {
      const { data: ownedBrandDetails, error: ownedBrandsError } =
        await supabase
          .from("brands")
          .select("id, name")
          .in("id", verification.owned_brands);

      if (!ownedBrandsError && ownedBrandDetails) {
        console.log("   Owned Brand Names:");
        ownedBrandDetails.forEach((brand) => {
          console.log(`     - ${brand.name} (${brand.id})`);
        });
      }
    }

    console.log("🎉 Successfully made eloka@culturin.com a brand owner!");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the script
makeBrandOwner();
