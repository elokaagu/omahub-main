const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  try {
    console.log("🔍 Checking database schema...");

    // Check collections table structure
    console.log("\n📋 Collections table info:");
    const { data: collections } = await supabase
      .from("collections")
      .select("*")
      .limit(1);

    if (collections && collections.length > 0) {
      console.log("Collection ID type:", typeof collections[0].id);
      console.log("Collection ID value:", collections[0].id);
    }

    // Check products table structure
    console.log("\n📦 Products table info:");
    const { data: products } = await supabase
      .from("products")
      .select("*")
      .limit(1);

    if (products && products.length > 0) {
      console.log("Product ID type:", typeof products[0].id);
      console.log("Product ID value:", products[0].id);
      console.log(
        "Product collection_id type:",
        typeof products[0].collection_id
      );
      console.log("Product collection_id value:", products[0].collection_id);
      console.log("Product brand_id type:", typeof products[0].brand_id);
      console.log("Product brand_id value:", products[0].brand_id);
    }

    // Try to update the product to link it to the collection
    console.log("\n🔗 Attempting to link product to collection...");
    const { data: updateResult, error: updateError } = await supabase
      .from("products")
      .update({ collection_id: "detty-december" })
      .eq("brand_id", "ehbs-couture")
      .select();

    if (updateError) {
      console.error("❌ Error updating product:", updateError);

      // Try with UUID conversion if needed
      console.log("\n🔄 Checking if collection ID needs UUID conversion...");

      // First, let's see what the actual collection UUID is
      const { data: collectionData } = await supabase
        .from("collections")
        .select("id")
        .eq("id", "detty-december");

      if (collectionData && collectionData.length > 0) {
        console.log("✅ Collection exists with ID:", collectionData[0].id);
      } else {
        console.log("❌ Collection not found");
      }
    } else {
      console.log("✅ Successfully linked product to collection");
      console.log("Updated product:", updateResult);
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

checkSchema();
