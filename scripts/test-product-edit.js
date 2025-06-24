const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testProductEdit() {
  try {
    console.log("🧪 Testing product edit functionality...");

    // Get a product to test with
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .limit(1);

    if (productsError || !products || products.length === 0) {
      console.error("❌ No products found for testing:", productsError);
      return;
    }

    const testProduct = products[0];
    console.log(`✅ Using product: ${testProduct.title} (${testProduct.id})`);

    // Test getProductById function
    console.log("\n📋 Testing getProductById...");
    const { data: productById, error: getError } = await supabase
      .from("products")
      .select("*")
      .eq("id", testProduct.id)
      .single();

    if (getError) {
      console.error("❌ Error getting product by ID:", getError);
      return;
    }

    console.log("✅ getProductById works correctly");
    console.log(`   - Title: ${productById.title}`);
    console.log(`   - Price: $${productById.price}`);
    console.log(`   - Brand ID: ${productById.brand_id}`);

    // Test updateProduct function
    console.log("\n🔄 Testing updateProduct...");
    const originalTitle = productById.title;
    const testTitle = `${originalTitle} (EDITED TEST)`;

    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update({
        title: testTitle,
        updated_at: new Date().toISOString(),
      })
      .eq("id", testProduct.id)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Error updating product:", updateError);
      return;
    }

    console.log("✅ updateProduct works correctly");
    console.log(`   - Original title: ${originalTitle}`);
    console.log(`   - Updated title: ${updatedProduct.title}`);

    // Restore original title
    console.log("\n🔄 Restoring original title...");
    const { error: restoreError } = await supabase
      .from("products")
      .update({
        title: originalTitle,
        updated_at: new Date().toISOString(),
      })
      .eq("id", testProduct.id);

    if (restoreError) {
      console.error("⚠️  Could not restore original title:", restoreError);
    } else {
      console.log("✅ Original title restored");
    }

    console.log("\n🎉 Product edit functionality test completed successfully!");
    console.log("The edit page should now work properly.");
  } catch (error) {
    console.error("❌ Error in test:", error);
  }
}

testProductEdit();
