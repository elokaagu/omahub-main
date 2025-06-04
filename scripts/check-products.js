const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProducts() {
  try {
    console.log("🔍 Checking products table...");

    // Check all products
    const {
      data: allProducts,
      error: allError,
      count: allCount,
    } = await supabase.from("products").select("*", { count: "exact" });

    if (allError) {
      console.error("❌ Error fetching all products:", allError);
      return;
    }

    console.log(`✅ Total products found: ${allCount}`);

    if (allProducts && allProducts.length > 0) {
      console.log(
        "📋 Sample product:",
        JSON.stringify(allProducts[0], null, 2)
      );

      // Check products for the specific collection
      console.log("\n🔍 Checking products for 'detty-december' collection...");
      const { data: collectionProducts, error: collectionError } =
        await supabase
          .from("products")
          .select("*")
          .eq("collection_id", "detty-december");

      if (collectionError) {
        console.error(
          "❌ Error fetching products for collection:",
          collectionError
        );
      } else {
        console.log(
          `✅ Products in 'detty-december' collection: ${collectionProducts?.length || 0}`
        );
        if (collectionProducts && collectionProducts.length > 0) {
          console.log(
            "📋 Sample collection product:",
            JSON.stringify(collectionProducts[0], null, 2)
          );
        }
      }

      // Check products for Ehbs Couture brand
      console.log("\n🔍 Checking products for 'ehbs-couture' brand...");
      const { data: brandProducts, error: brandError } = await supabase
        .from("products")
        .select("*")
        .eq("brand_id", "ehbs-couture");

      if (brandError) {
        console.error("❌ Error fetching products for brand:", brandError);
      } else {
        console.log(
          `✅ Products for 'ehbs-couture' brand: ${brandProducts?.length || 0}`
        );
        if (brandProducts && brandProducts.length > 0) {
          console.log(
            "📋 Sample brand product:",
            JSON.stringify(brandProducts[0], null, 2)
          );
        }
      }
    } else {
      console.log("⚠️ No products found in database");
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

checkProducts();
