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

async function checkCurrentImages() {
  try {
    console.log("🔍 Checking current image state in database...");

    // Check brands
    console.log("\n🏷️ Checking brands...");
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    console.log(`Found ${brands.length} brands:`);
    brands.forEach((brand, index) => {
      console.log(`  ${index + 1}. ${brand.name}`);
      console.log(`     Image: ${brand.image}`);
      console.log(
        `     Is placeholder: ${brand.image?.includes("via.placeholder.com") ? "YES" : "NO"}`
      );
    });

    // Check products
    console.log("\n📦 Checking products...");
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, image");

    if (productsError) {
      console.error("❌ Error fetching products:", productsError);
      return;
    }

    console.log(`Found ${products.length} products:`);
    products.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.title}`);
      console.log(`     Image: ${product.image}`);
      console.log(
        `     Is placeholder: ${product.image?.includes("via.placeholder.com") ? "YES" : "NO"}`
      );
    });

    // Check collections
    console.log("\n🖼️ Checking collections...");
    const { data: collections, error: collectionsError } = await supabase
      .from("collections")
      .select("id, name, image");

    if (collectionsError) {
      console.error("❌ Error fetching collections:", collectionsError);
      return;
    }

    console.log(`Found ${collections.length} collections:`);
    collections.forEach((collection, index) => {
      console.log(`  ${index + 1}. ${collection.name}`);
      console.log(`     Image: ${collection.image}`);
      console.log(
        `     Is placeholder: ${collection.image?.includes("via.placeholder.com") ? "YES" : "NO"}`
      );
    });

    // Summary
    const totalPlaceholders = [
      ...brands.filter((b) => b.image?.includes("via.placeholder.com")),
      ...products.filter((p) => p.image?.includes("via.placeholder.com")),
      ...collections.filter((c) => c.image?.includes("via.placeholder.com")),
    ].length;

    console.log(`\n📊 Summary:`);
    console.log(`Total items with placeholder images: ${totalPlaceholders}`);
    console.log(
      `Total items checked: ${brands.length + products.length + collections.length}`
    );
  } catch (error) {
    console.error("❌ Error in checkCurrentImages:", error);
  }
}

// Run the check
checkCurrentImages()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
