const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const supabaseUrl = "https://gswduyodzdgucjscjtvz.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAxNzQzOCwiZXhwIjoyMDYzNTkzNDM4fQ.4sqZxnRlSXQwRv7wB5JEWcpdTr5_Ucb97IF-32SRG7k";

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function completeBrandOwner() {
  try {
    console.log("🎯 Completing brand owner setup for eloka@culturin.com");

    // Check current user status
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id, email, role, owned_brands")
      .eq("email", "eloka@culturin.com")
      .single();

    if (userError || !user) {
      console.error("❌ User not found:", userError);
      return;
    }

    console.log("✅ Current user status:", {
      email: user.email,
      role: user.role,
      owned_brands: user.owned_brands,
    });

    // Check if user already owns the brand
    const currentOwnedBrands = user.owned_brands || [];
    if (currentOwnedBrands.includes("ehbs-couture")) {
      console.log("✅ User already owns Ehbs Couture!");
      console.log("🎉 Brand owner setup is complete!");
      return;
    }

    // Add Ehbs Couture to owned brands
    const newOwnedBrands = [...currentOwnedBrands, "ehbs-couture"];

    console.log("🔄 Adding Ehbs Couture to owned brands...");
    console.log("   Current owned_brands:", currentOwnedBrands);
    console.log("   New owned_brands:", newOwnedBrands);

    const { data: updatedUser, error: updateError } = await supabase
      .from("profiles")
      .update({
        owned_brands: newOwnedBrands,
      })
      .eq("email", "eloka@culturin.com")
      .select()
      .single();

    if (updateError) {
      console.error("❌ Error updating owned_brands:", updateError);
      console.log(
        "\n⚠️ This error suggests the column type fix hasn't been applied yet."
      );
      console.log(
        "   Please run the SQL commands from BRAND_OWNER_SETUP.md first."
      );
      return;
    }

    console.log("✅ Successfully updated owned_brands!");

    // Final verification
    const { data: verification, error: verifyError } = await supabase
      .from("profiles")
      .select("id, email, role, owned_brands")
      .eq("email", "eloka@culturin.com")
      .single();

    if (verifyError) {
      console.error("❌ Error verifying update:", verifyError);
      return;
    }

    console.log("\n🔍 Final verification:");
    console.log(`   User: ${verification.email}`);
    console.log(`   Role: ${verification.role}`);
    console.log(
      `   Owned Brands: ${JSON.stringify(verification.owned_brands)}`
    );

    // Get brand details for owned brands
    if (verification.owned_brands && verification.owned_brands.length > 0) {
      const { data: ownedBrandDetails, error: ownedBrandsError } =
        await supabase
          .from("brands")
          .select("id, name, category, location")
          .in("id", verification.owned_brands);

      if (!ownedBrandsError && ownedBrandDetails) {
        console.log("\n   📋 Owned Brand Details:");
        ownedBrandDetails.forEach((brand) => {
          console.log(`     - ${brand.name} (${brand.id})`);
          console.log(
            `       Category: ${brand.category}, Location: ${brand.location}`
          );
        });
      }
    }

    console.log("\n🎉 Brand owner setup completed successfully!");
    console.log(
      "🔐 eloka@culturin.com can now manage Ehbs Couture in the studio"
    );
    console.log("🌐 User can access the studio at: /studio");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the script
completeBrandOwner();
