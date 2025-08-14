const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixSpecialCharacterBrand() {
  try {
    console.log("🔍 Fixing brand with special characters...");

    // 1. Find the brand with special characters
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image")
      .order("name");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    // Find the brand that contains "LENTAR" (without special characters)
    const specialBrand = brands.find(
      (b) =>
        b.name.includes("LENTAR") ||
        b.name.includes("LÈNTÁR") ||
        (b.name.includes("K") &&
          b.name.includes("L") &&
          b.name.includes("N") &&
          b.name.includes("T") &&
          b.name.includes("R"))
    );

    if (!specialBrand) {
      console.log("❌ Could not find the special character brand");
      return;
    }

    console.log(`🔍 Found special character brand: "${specialBrand.name}"`);
    console.log(`   ID: ${specialBrand.id}`);
    console.log(
      `   Current image: ${specialBrand.image ? specialBrand.image.substring(0, 80) + "..." : "None"}`
    );

    // 2. Get the correct image for this brand
    const correctImageName = "2a14c31f_1754929569195.jpeg";
    const imageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${correctImageName}`;

    console.log(`   Correct image: ${correctImageName}`);
    console.log(`   New URL: ${imageUrl}`);

    // 3. Update the brand's image
    const { error: updateError } = await supabase
      .from("brands")
      .update({ image: imageUrl })
      .eq("id", specialBrand.id);

    if (updateError) {
      console.error(`❌ Failed to update ${specialBrand.name}:`, updateError);
    } else {
      console.log(`✅ Successfully updated ${specialBrand.name}`);

      // 4. Verify the update
      const { data: updatedBrand, error: verifyError } = await supabase
        .from("brands")
        .select("name, image")
        .eq("id", specialBrand.id)
        .single();

      if (!verifyError && updatedBrand) {
        console.log(`\n🔍 Verification:`);
        console.log(`   Brand: ${updatedBrand.name}`);
        console.log(`   Image: ${updatedBrand.image}`);
        console.log(
          `   Has real image: ${updatedBrand.image && !updatedBrand.image.includes("placeholder") ? "✅ Yes" : "❌ No"}`
        );
      }
    }

    console.log("\n🎉 Special character brand fix completed!");
  } catch (error) {
    console.error("❌ Error in fixSpecialCharacterBrand:", error);
  }
}

// Run the fix
fixSpecialCharacterBrand()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
