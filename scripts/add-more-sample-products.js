const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addMoreSampleProducts() {
  try {
    console.log(
      "🛍️ Adding more sample products for 'You may also like' section..."
    );

    const brandId = "ehbs-couture";
    const collectionId = "c7d7aef3-73ce-40f0-b84d-89cd15a4179f";

    // Additional fashion images for variety
    const sampleProducts = [
      {
        title: "Sophisticated Cocktail Dress",
        description:
          "A chic cocktail dress perfect for evening events. Features elegant draping and can be customized with your preferred neckline and sleeve style.",
        price: 320,
        sale_price: 280,
        image:
          "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=800&fit=crop",
        category: "Evening Wear",
        brand_id: brandId,
        collection_id: collectionId,
        in_stock: true,
        sizes: [],
        colors: [],
      },
      {
        title: "Luxury Formal Gown",
        description:
          "An exquisite formal gown with intricate beadwork and flowing silhouette. Perfect for galas and special occasions with custom tailoring available.",
        price: 650,
        sale_price: 550,
        image:
          "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=800&fit=crop",
        category: "Formal Wear",
        brand_id: brandId,
        collection_id: collectionId,
        in_stock: true,
        sizes: [],
        colors: [],
      },
      {
        title: "Designer Party Dress",
        description:
          "A stunning party dress that combines modern style with classic elegance. Features unique design elements and premium fabric selection.",
        price: 420,
        sale_price: null,
        image:
          "https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=800&h=800&fit=crop",
        category: "Party Wear",
        brand_id: brandId,
        collection_id: collectionId,
        in_stock: true,
        sizes: [],
        colors: [],
      },
      {
        title: "Couture Evening Ensemble",
        description:
          "A complete evening ensemble featuring a sophisticated top and flowing skirt. Designed for the modern woman who appreciates luxury and style.",
        price: 580,
        sale_price: 480,
        image:
          "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&h=800&fit=crop",
        category: "Evening Wear",
        brand_id: brandId,
        collection_id: collectionId,
        in_stock: true,
        sizes: [],
        colors: [],
      },
    ];

    console.log(`📦 Creating ${sampleProducts.length} additional products...`);

    for (let i = 0; i < sampleProducts.length; i++) {
      const product = sampleProducts[i];
      console.log(`\n${i + 1}. Creating: ${product.title}`);

      const { data: newProduct, error } = await supabase
        .from("products")
        .insert(product)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating ${product.title}:`, error);
      } else {
        console.log(
          `✅ Created: ${newProduct.title} - $${newProduct.price}${newProduct.sale_price ? ` (Sale: $${newProduct.sale_price})` : ""}`
        );
      }
    }

    // Verify all products in collection
    console.log("\n🔍 Verifying all products in collection...");
    const { data: allProducts, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("collection_id", collectionId)
      .order("created_at");

    if (fetchError) {
      console.error("❌ Error fetching products:", fetchError);
    } else {
      console.log(`✅ Total products in collection: ${allProducts.length}`);
      allProducts.forEach((product, index) => {
        console.log(
          `   ${index + 1}. ${product.title} - $${product.price}${product.sale_price ? ` (Sale: $${product.sale_price})` : ""}`
        );
      });
    }

    console.log("\n🎉 Sample products added successfully!");
    console.log(
      "💡 Now the collection page will have products for the 'You may also like' section"
    );
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

addMoreSampleProducts();
