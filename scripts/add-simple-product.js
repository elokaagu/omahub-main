const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addSimpleProduct() {
  try {
    console.log("🔍 Finding Ehbs Couture brand...");

    // Find Ehbs Couture brand
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("*")
      .eq("id", "ehbs-couture")
      .single();

    if (brandError || !brand) {
      console.error("❌ Ehbs Couture brand not found:", brandError);
      return;
    }

    console.log("✅ Found brand:", brand.name);

    // Create simple product with only existing columns
    const productData = {
      title: "Elegant Evening Gown",
      description:
        "A stunning custom-tailored evening gown perfect for special occasions. Features intricate beadwork and flowing silhouette that can be customized to your exact measurements and style preferences.",
      price: 450.0,
      sale_price: 380.0,
      image:
        "https://images.unsplash.com/photo-1566479179817-c0b5b4b8b1b1?w=800&h=800&fit=crop",
      brand_id: "ehbs-couture",
      category: "Evening Wear",
      in_stock: true,
      created_at: new Date().toISOString(),
    };

    console.log("📦 Creating simple product...");

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert(productData)
      .select()
      .single();

    if (productError) {
      console.error("❌ Error creating product:", productError);
      return;
    }

    console.log("✅ Successfully created example product:");
    console.log(`   - ID: ${product.id}`);
    console.log(`   - Title: ${product.title}`);
    console.log(`   - Price: $${product.price} (Sale: $${product.sale_price})`);
    console.log(`   - Brand: ${brand.name}`);
    console.log(`   - Category: ${product.category}`);

    console.log("\n🎉 Example product added successfully!");
    console.log(`🔗 You can view it at: /product/${product.id}`);
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

addSimpleProduct();
