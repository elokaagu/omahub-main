const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkProductImages() {
  try {
    console.log("🔍 Checking product image accuracy...");
    
    // Get all products with their current images
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, brand_id, image, created_at")
      .order("title");
    
    if (productsError) {
      console.error("❌ Error fetching products:", productsError);
      return;
    }
    
    console.log(`📋 Found ${products.length} products`);
    
    // Get brand names for context
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name");
    
    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }
    
    const brandMap = brands.reduce((acc, brand) => {
      acc[brand.id] = brand.name;
      return acc;
    }, {});
    
    // Analyze image patterns
    let uniqueImageCount = 0;
    const uniqueImages = new Set();
    const imageProductMap = {};
    
    products.forEach(product => {
      if (product.image) {
        uniqueImages.add(product.image);
        
        // Track which products use each image
        if (!imageProductMap[product.image]) {
          imageProductMap[product.image] = [];
        }
        imageProductMap[product.image].push({
          id: product.id,
          title: product.title,
          brand: brandMap[product.brand_id] || 'Unknown'
        });
      }
    });
    
    uniqueImageCount = uniqueImages.size;
    
    console.log(`\n📊 Image Analysis:`);
    console.log(`   🖼️ Unique images: ${uniqueImageCount}`);
    console.log(`   📦 Total products: ${products.length}`);
    console.log(`   🔄 Duplicate images: ${products.length - uniqueImageCount}`);
    
    // Show products with duplicate images
    const duplicates = Object.entries(imageProductMap).filter(([image, products]) => products.length > 1);
    if (duplicates.length > 0) {
      console.log(`\n🔄 Products with duplicate images:`);
      duplicates.forEach(([image, productList]) => {
        const filename = image.split('/').pop() || '';
        console.log(`\n   📸 Image: ${filename}`);
        console.log(`   🔗 URL: ${image}`);
        console.log(`   📋 Used by ${productList.length} products:`);
        productList.forEach(product => {
          console.log(`      - ${product.title} (${product.brand})`);
        });
      });
    }
    
    // Show first few products with their images
    console.log(`\n📋 Sample product images (first 10):`);
    products.slice(0, 10).forEach(product => {
      const brandName = brandMap[product.brand_id] || 'Unknown';
      const filename = product.image ? product.image.split('/').pop() : 'No image';
      console.log(`   - ${product.title} (${brandName}): ${filename}`);
    });
    
    console.log(`\n🎯 Product image check completed!`);
    
  } catch (error) {
    console.error("❌ Error in checkProductImages:", error);
  }
}

// Run the check
checkProductImages().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
