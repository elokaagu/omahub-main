const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testProductCreation() {
  try {
    console.log("🧪 Testing product creation with current schema...");

    // First, get a valid brand ID
    const { data: brands, error: brandError } = await supabase
      .from("brands")
      .select("id, name")
      .limit(1);

    if (brandError || !brands || brands.length === 0) {
      console.error("❌ No brands found:", brandError);
      return;
    }

    const brandId = brands[0].id;
    console.log(`✅ Using brand: ${brands[0].name} (${brandId})`);

    // Test with only core fields that we know exist
    const testProduct = {
      title: "Test Product - Core Fields Only",
      description: "Testing product creation with core fields",
      price: 99.99,
      sale_price: 79.99,
      image: "https://via.placeholder.com/400x400?text=Test+Product",
      brand_id: brandId,
      category: "Test Category",
      in_stock: true,
      sizes: ["S", "M", "L"],
      colors: ["Red", "Blue"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("\n📦 Creating test product with core fields...");

    const { data: product, error: createError } = await supabase
      .from("products")
      .insert(testProduct)
      .select()
      .single();

    if (createError) {
      console.error("❌ Product creation failed:", createError);
      return;
    }

    console.log("✅ Product created successfully!");
    console.log(`   - ID: ${product.id}`);
    console.log(`   - Title: ${product.title}`);
    console.log(`   - Price: $${product.price}`);

    // Clean up the test product
    console.log("\n🧹 Cleaning up test product...");
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (deleteError) {
      console.error("⚠️  Could not delete test product:", deleteError);
    } else {
      console.log("✅ Test product cleaned up");
    }

    console.log("\n🎉 Product creation test completed successfully!");
    console.log("The create product form should now work properly.");
  } catch (error) {
    console.error("❌ Error in test:", error);
  }
}

testProductCreation();
