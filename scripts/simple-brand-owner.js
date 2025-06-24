const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const supabaseUrl = "https://gswduyodzdgucjscjtvz.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAxNzQzOCwiZXhwIjoyMDYzNTkzNDM4fQ.4sqZxnRlSXQwRv7wB5JEWcpdTr5_Ucb97IF-32SRG7k";

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeBrandOwnerSimple() {
  try {
    console.log(
      "🎯 Simple approach: Making eloka@culturin.com a brand owner for Ehbs Couture"
    );

    // Try to update the user directly with text array
    console.log("🔄 Attempting to update user with text array...");

    const { data: updatedUser, error: updateError } = await supabase
      .from("profiles")
      .update({
        role: "brand_admin",
        owned_brands: ["ehbs-couture"], // Direct text array
      })
      .eq("email", "eloka@culturin.com")
      .select()
      .single();

    if (updateError) {
      console.error(
        "❌ Error updating user (expected if column is still uuid[]):",
        updateError
      );

      // Let's try to check the current column type
      console.log("\n🔍 Let me check what we can do...");

      // Try to get current user data
      const { data: currentUser, error: getUserError } = await supabase
        .from("profiles")
        .select("id, email, role, owned_brands")
        .eq("email", "eloka@culturin.com")
        .single();

      if (!getUserError && currentUser) {
        console.log("✅ Current user data:", currentUser);

        // Try updating just the role first
        console.log("🔄 Trying to update just the role...");
        const { data: roleUpdate, error: roleError } = await supabase
          .from("profiles")
          .update({ role: "brand_admin" })
          .eq("email", "eloka@culturin.com")
          .select()
          .single();

        if (roleError) {
          console.error("❌ Error updating role:", roleError);
        } else {
          console.log(
            "✅ Successfully updated role to brand_admin:",
            roleUpdate
          );
          console.log(
            "\n⚠️ Note: The owned_brands column needs to be fixed manually."
          );
          console.log(
            "   The column is currently uuid[] but brand IDs are strings."
          );
          console.log(
            "   You need to run this SQL in the Supabase SQL editor:"
          );
          console.log(
            "   ALTER TABLE profiles ALTER COLUMN owned_brands TYPE text[];"
          );
        }
      }

      return;
    }

    console.log("✅ User updated successfully!", updatedUser);

    // Verify the update
    const { data: verification, error: verifyError } = await supabase
      .from("profiles")
      .select("id, email, role, owned_brands")
      .eq("email", "eloka@culturin.com")
      .single();

    if (verifyError) {
      console.error("❌ Error verifying update:", verifyError);
      return;
    }

    console.log("🔍 Final verification:");
    console.log(`   User: ${verification.email}`);
    console.log(`   Role: ${verification.role}`);
    console.log(
      `   Owned Brands: ${JSON.stringify(verification.owned_brands)}`
    );

    // Get brand details
    if (verification.owned_brands && verification.owned_brands.length > 0) {
      const { data: ownedBrandDetails, error: ownedBrandsError } =
        await supabase
          .from("brands")
          .select("id, name")
          .in("id", verification.owned_brands);

      if (!ownedBrandsError && ownedBrandDetails) {
        console.log("   Owned Brand Details:");
        ownedBrandDetails.forEach((brand) => {
          console.log(`     - ${brand.name} (${brand.id})`);
        });
      }
    }

    console.log(
      "\n🎉 Successfully made eloka@culturin.com a brand owner for Ehbs Couture!"
    );
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the script
makeBrandOwnerSimple();
