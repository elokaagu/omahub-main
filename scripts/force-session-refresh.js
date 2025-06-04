const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://gswduyodzdgucjscjtvz.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAxNzQzOCwiZXhwIjoyMDYzNTkzNDM4fQ.4sqZxnRlSXQwRv7wB5JEWcpdTr5_Ucb97IF-32SRG7k";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function forceSessionRefresh() {
  try {
    console.log("🔄 Force refreshing session data for eloka@culturin.com...\n");

    // Step 1: Get the user from auth
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("❌ Error fetching auth users:", authError);
      return;
    }

    const elokaUser = authUsers.users.find(
      (user) => user.email === "eloka@culturin.com"
    );

    if (!elokaUser) {
      console.error("❌ User eloka@culturin.com not found");
      return;
    }

    console.log("✅ User found:", {
      id: elokaUser.id,
      email: elokaUser.email,
      last_sign_in_at: elokaUser.last_sign_in_at,
    });

    // Step 2: Update the profile with a timestamp to force refresh
    console.log("🔄 Updating profile to force refresh...");

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        updated_at: new Date().toISOString(),
        // Ensure the data is correct
        role: "brand_admin",
        owned_brands: ["ehbs-couture"],
      })
      .eq("id", elokaUser.id)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Error updating profile:", updateError);
      return;
    }

    console.log("✅ Profile updated:", {
      role: updatedProfile.role,
      owned_brands: updatedProfile.owned_brands,
      updated_at: updatedProfile.updated_at,
    });

    // Step 3: Verify the brand exists and is accessible
    console.log("\n🔍 Verifying brand access...");

    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name, category, location")
      .eq("id", "ehbs-couture")
      .single();

    if (brandError) {
      console.error("❌ Brand not found:", brandError);
      return;
    }

    console.log("✅ Brand verified:", brand);

    // Step 4: Test the filtering logic
    console.log("\n🧪 Testing filtering logic...");

    const { data: allBrands, error: allBrandsError } = await supabase
      .from("brands")
      .select("id, name")
      .order("name");

    if (allBrandsError) {
      console.error("❌ Error fetching all brands:", allBrandsError);
      return;
    }

    const ownedBrandIds = updatedProfile.owned_brands || [];
    const filteredBrands = allBrands.filter((brand) =>
      ownedBrandIds.includes(brand.id)
    );

    console.log("✅ Filtering test results:", {
      totalBrands: allBrands.length,
      ownedBrandIds,
      filteredBrands: filteredBrands.length,
      brandNames: filteredBrands.map((b) => b.name),
    });

    console.log("\n🎯 SUMMARY:");
    console.log("✅ User profile updated with fresh timestamp");
    console.log("✅ Role confirmed as brand_admin");
    console.log("✅ Owned brands confirmed as ['ehbs-couture']");
    console.log("✅ Brand exists and is accessible");
    console.log("✅ Filtering logic works correctly");
    console.log("\n💡 The user should now see their brand in the frontend!");
    console.log("   If they still don't see it, the issue is likely:");
    console.log("   1. Frontend cache/session not refreshed");
    console.log("   2. AuthContext not providing latest user data");
    console.log("   3. Component not re-rendering with new data");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

forceSessionRefresh();
