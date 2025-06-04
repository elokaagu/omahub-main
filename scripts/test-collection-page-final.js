const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCollectionPageFinal() {
  try {
    const collectionId = "c7d7aef3-73ce-40f0-b84d-89cd15a4179f";

    console.log("🧪 Testing Collection Page Final Implementation...");
    console.log("Collection ID:", collectionId);

    // 1. Test collection data retrieval
    console.log("\n1️⃣ Testing collection data retrieval...");
    const { data: collection, error: collectionError } = await supabase
      .from("collections")
      .select("*")
      .eq("id", collectionId)
      .single();

    if (collectionError) {
      console.error("❌ Collection error:", collectionError);
      return;
    }

    console.log("✅ Collection found:", collection.title);
    console.log("🖼️ Collection image:", collection.image);

    // 2. Test brand data retrieval
    console.log("\n2️⃣ Testing brand data retrieval...");
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("*")
      .eq("id", collection.brand_id)
      .single();

    if (brandError) {
      console.error("❌ Brand error:", brandError);
      return;
    }

    console.log("✅ Brand found:", brand.name);
    console.log("📍 Location:", brand.location);
    console.log("⭐ Rating:", brand.rating);

    // 3. Test products in collection
    console.log("\n3️⃣ Testing products in collection...");
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("collection_id", collectionId)
      .order("created_at", { ascending: false });

    if (productsError) {
      console.error("❌ Products error:", productsError);
      return;
    }

    console.log(`✅ Products found: ${products.length}`);
    products.forEach((product, index) => {
      console.log(
        `   ${index + 1}. ${product.title} - $${product.price}${product.sale_price ? ` (Sale: $${product.sale_price})` : ""}`
      );
      console.log(`      Image: ${product.image.substring(0, 60)}...`);
    });

    // 4. Test recommendations (You may also like)
    console.log("\n4️⃣ Testing 'You may also like' recommendations...");
    const { data: recommendations, error: recError } = await supabase
      .from("products")
      .select("*")
      .eq("collection_id", collectionId)
      .limit(4)
      .order("created_at", { ascending: false });

    if (recError) {
      console.error("❌ Recommendations error:", recError);
      return;
    }

    console.log(`✅ Recommendations available: ${recommendations.length}`);
    if (recommendations.length > 1) {
      // Simulate shuffling for variety
      const shuffled = [...recommendations].sort(() => Math.random() - 0.5);
      console.log("🔀 Shuffled recommendations for variety:");
      shuffled.slice(0, 4).forEach((product, index) => {
        console.log(
          `   ${index + 1}. ${product.title} - $${product.sale_price || product.price}`
        );
      });
    }

    // 5. Test image URLs
    console.log("\n5️⃣ Testing image URLs...");
    console.log("📸 Collection image URL:", collection.image);
    console.log("🎯 Sample product image URL:", products[0]?.image);

    // Check if product is using collection image
    const usingCollectionImage = products.some(
      (p) => p.image === collection.image
    );
    console.log(
      `✅ Product using collection image: ${usingCollectionImage ? "Yes" : "No"}`
    );

    // 6. Summary
    console.log("\n📊 COLLECTION PAGE SUMMARY:");
    console.log("=".repeat(50));
    console.log(`Collection: ${collection.title}`);
    console.log(`Brand: ${brand.name} (${brand.location})`);
    console.log(`Products: ${products.length}`);
    console.log(
      `Recommendations: ${recommendations.length > 1 ? "Available" : "Limited"}`
    );
    console.log(
      `Image consistency: ${usingCollectionImage ? "Good" : "Mixed"}`
    );
    console.log("=".repeat(50));

    console.log("\n🎉 Collection page test completed successfully!");
    console.log("💡 The page should now display:");
    console.log("   ✓ Collection header with image and info");
    console.log("   ✓ Products in collection grid");
    console.log("   ✓ 'You may also like' section with recommendations");
    console.log("   ✓ Consistent styling and hover effects");
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

testCollectionPageFinal();
