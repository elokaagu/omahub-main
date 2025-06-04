const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCollectionPage() {
  try {
    const collectionId = "c7d7aef3-73ce-40f0-b84d-89cd15a4179f";

    console.log("🧪 Testing collection page data loading...");
    console.log("Collection ID:", collectionId);

    // Test 1: Get collection by ID (what the collection page does)
    console.log("\n1️⃣ Testing getCollectionById...");
    const { data: collection, error: collectionError } = await supabase
      .from("collections")
      .select("*")
      .eq("id", collectionId)
      .single();

    if (collectionError) {
      console.error("❌ Error fetching collection:", collectionError);
      return;
    }

    console.log("✅ Collection found:", collection.title);

    // Test 2: Get products by collection ID (what the collection page does)
    console.log("\n2️⃣ Testing getProductsByCollection...");
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(
        `
        *,
        brand:brands(id, name, location, is_verified, category)
      `
      )
      .eq("collection_id", collectionId);

    if (productsError) {
      console.error("❌ Error fetching products:", productsError);
      return;
    }

    console.log(`✅ Products found: ${products.length}`);
    if (products.length > 0) {
      console.log("📦 Sample product:", {
        title: products[0].title,
        price: products[0].price,
        brand: products[0].brand?.name,
      });
    }

    // Test 3: Get collection with brand info (for breadcrumbs)
    console.log("\n3️⃣ Testing collection with brand info...");
    const { data: collectionWithBrand, error: brandError } = await supabase
      .from("collections")
      .select(
        `
        *,
        brand:brands(id, name, location, is_verified, category)
      `
      )
      .eq("id", collectionId)
      .single();

    if (brandError) {
      console.error("❌ Error fetching collection with brand:", brandError);
      return;
    }

    console.log("✅ Collection with brand:", {
      collection: collectionWithBrand.title,
      brand: collectionWithBrand.brand?.name,
    });

    console.log(
      "\n🎉 All tests passed! Collection page should work correctly."
    );
    console.log("🔗 Collection URL: /collection/" + collectionId);
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

testCollectionPage();
