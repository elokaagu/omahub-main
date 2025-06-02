const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testBrandUpdate() {
  console.log("🧪 Testing brand update with service role key...");

  try {
    // First, get a brand to test with
    const { data: brands, error: fetchError } = await supabase
      .from("brands")
      .select("id, name, description")
      .limit(1);

    if (fetchError) {
      console.error("❌ Error fetching brands:", fetchError);
      return;
    }

    if (!brands || brands.length === 0) {
      console.log("⚠️ No brands found to test with");
      return;
    }

    const testBrand = brands[0];
    console.log("📦 Testing with brand:", testBrand.name);
    console.log("📝 Original description:", testBrand.description);

    // Try to update the brand
    const testDescription = testBrand.description + " (test update)";
    const { data: updatedBrand, error: updateError } = await supabase
      .from("brands")
      .update({ description: testDescription })
      .eq("id", testBrand.id)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Update error:", updateError);
      console.error("❌ Error code:", updateError.code);
      console.error("❌ Error details:", updateError.details);
    } else {
      console.log("✅ Update successful!");
      console.log("📝 New description:", updatedBrand.description);

      // Revert the change
      console.log("🔄 Reverting change...");
      const { error: revertError } = await supabase
        .from("brands")
        .update({ description: testBrand.description })
        .eq("id", testBrand.id);

      if (revertError) {
        console.error("❌ Error reverting:", revertError);
      } else {
        console.log("✅ Change reverted successfully");
      }
    }

    // Also test with anon key to see the difference
    console.log("\n🔒 Testing with anon key...");
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: anonBrands, error: anonError } = await anonSupabase
      .from("brands")
      .update({ description: testDescription })
      .eq("id", testBrand.id)
      .select()
      .single();

    if (anonError) {
      console.error("❌ Anon update error (expected):", anonError.message);
    } else {
      console.log("⚠️ Anon update succeeded (unexpected)");
    }
  } catch (error) {
    console.error("❌ Script error:", error);
  }
}

testBrandUpdate();
