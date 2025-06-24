const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testProductsWithDetails() {
  try {
    console.log("🧪 Testing getProductsWithDetails function...");

    // Test the manual join approach
    console.log("\n📋 Testing manual join approach...");

    // First, get products with brands (this works)
    const { data: productsWithBrands, error: productsError } =
      await supabase.from("products").select(`
        *,
        brand:brands(id, name, location, is_verified)
      `);

    if (productsError) {
      console.error("❌ Error fetching products with brands:", productsError);
      return;
    }

    console.log(
      `✅ Products with brands: ${productsWithBrands.length} products`
    );

    // Get all collections to manually join
    const { data: collections, error: collectionsError } = await supabase
      .from("collections")
      .select("id, title");

    if (collectionsError) {
      console.error("❌ Error fetching collections:", collectionsError);
      return;
    }

    console.log(`✅ Collections: ${collections.length} collections`);

    // Manually join collections data
    const productsWithDetails = productsWithBrands.map((product) => {
      const collection = collections?.find(
        (c) => c.id === product.collection_id
      );
      return {
        ...product,
        collection: collection
          ? { id: collection.id, title: collection.title }
          : undefined,
      };
    });

    console.log(
      `✅ Manual join successful: ${productsWithDetails.length} products with details`
    );

    if (productsWithDetails.length > 0) {
      console.log("\n📋 Sample product with manually joined details:");
      console.log(JSON.stringify(productsWithDetails[0], null, 2));
    }

    console.log(
      "\n🎉 Manual join approach works! The products page should now load properly."
    );
  } catch (error) {
    console.error("❌ Error in test:", error);
  }
}

testProductsWithDetails();
