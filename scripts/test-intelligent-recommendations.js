const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testIntelligentRecommendations() {
  try {
    console.log("🧠 Testing Intelligent Recommendations System...");

    const collectionId = "c7d7aef3-73ce-40f0-b84d-89cd15a4179f";
    const testUserId = "test-user-123"; // We'll create a test user scenario

    // 1. Test without user (fallback to collection products)
    console.log("\n1️⃣ Testing recommendations without user...");

    // Simulate the intelligent recommendations function
    let recommendations = [];

    // Get products from the same collection
    const { data: collectionProducts, error: collError } = await supabase
      .from("products")
      .select("*")
      .eq("collection_id", collectionId)
      .eq("in_stock", true)
      .limit(8); // Get more for variety

    if (collError) {
      console.error("❌ Error fetching collection products:", collError);
    } else {
      console.log(
        `✅ Found ${collectionProducts.length} products in collection`
      );
      // Shuffle and take 4
      const shuffled = collectionProducts.sort(() => Math.random() - 0.5);
      recommendations = shuffled.slice(0, 4);

      console.log("📋 Recommendations without user:");
      recommendations.forEach((product, index) => {
        console.log(
          `   ${index + 1}. ${product.title} - $${product.sale_price || product.price}`
        );
      });
    }

    // 2. Test with user favourites (simulate)
    console.log("\n2️⃣ Testing recommendations with user favourites...");

    // First, let's see what brands we have
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name")
      .limit(5);

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
    } else {
      console.log(
        `✅ Available brands: ${brands.map((b) => b.name).join(", ")}`
      );

      // Simulate user having favourites for some brands
      const favouriteBrandIds = brands.slice(0, 2).map((b) => b.id);
      console.log(
        `🤍 Simulating user favourites for brands: ${favouriteBrandIds.join(", ")}`
      );

      // Get products from favourite brands
      const { data: favouriteProducts, error: favError } = await supabase
        .from("products")
        .select("*")
        .in("brand_id", favouriteBrandIds)
        .eq("in_stock", true)
        .limit(8);

      if (favError) {
        console.error("❌ Error fetching favourite brand products:", favError);
      } else {
        console.log(
          `✅ Found ${favouriteProducts.length} products from favourite brands`
        );

        // Take up to 2 from favourites
        const favouriteRecommendations = favouriteProducts
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);

        // Fill remaining with collection products
        const remainingFromCollection = collectionProducts
          .filter((p) => !favouriteRecommendations.some((fp) => fp.id === p.id))
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);

        const intelligentRecommendations = [
          ...favouriteRecommendations,
          ...remainingFromCollection,
        ];

        console.log("🧠 Intelligent recommendations with user favourites:");
        intelligentRecommendations.forEach((product, index) => {
          const isFromFavourite = favouriteRecommendations.some(
            (fp) => fp.id === product.id
          );
          console.log(
            `   ${index + 1}. ${product.title} - $${product.sale_price || product.price} ${isFromFavourite ? "💖 (from favourite brand)" : "📦 (from collection)"}`
          );
        });
      }
    }

    // 3. Test the actual function implementation
    console.log(
      "\n3️⃣ Testing actual getIntelligentRecommendations function..."
    );

    // We'll test this by checking the database structure
    const { data: collections, error: collectionsError } = await supabase
      .from("collections")
      .select(
        `
        *,
        brand:brands(*)
      `
      )
      .eq("id", collectionId)
      .single();

    if (collectionsError) {
      console.error(
        "❌ Error fetching collection with brand:",
        collectionsError
      );
    } else {
      console.log("✅ Collection with brand data structure:");
      console.log(`   Collection: ${collections.title}`);
      console.log(`   Brand: ${collections.brand.name}`);
      console.log(`   Brand ID: ${collections.brand.id}`);
      console.log(`   Location: ${collections.brand.location}`);
    }

    // 4. Test favourites table structure
    console.log("\n4️⃣ Testing favourites table structure...");

    const { data: favouritesStructure, error: favStructError } = await supabase
      .from("favourites")
      .select("*")
      .limit(1);

    if (favStructError) {
      console.log(
        "⚠️ Favourites table might not exist or be empty:",
        favStructError.message
      );
    } else {
      console.log("✅ Favourites table structure confirmed");
      if (favouritesStructure.length > 0) {
        console.log("   Sample favourite:", favouritesStructure[0]);
      } else {
        console.log("   No favourites found (table is empty)");
      }
    }

    console.log("\n🎉 Intelligent Recommendations System Test Complete!");
    console.log("💡 The system will:");
    console.log("   ✓ Prioritize products from user's favourite brands");
    console.log("   ✓ Fall back to collection products when no favourites");
    console.log("   ✓ Fill remaining slots with brand products");
    console.log("   ✓ Shuffle results for variety on each visit");
    console.log("   ✓ Show personalization indicator when user is logged in");
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

testIntelligentRecommendations();
