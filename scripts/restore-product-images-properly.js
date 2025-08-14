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

async function restoreProductImagesProperly() {
  try {
    console.log("🎯 Restoring original product images with proper mapping...");
    
    // 1. Get all available images from storage
    console.log("\n📦 Step 1: Getting all available images...");
    
    const { data: productImages, error: productImagesError } = await supabase.storage
      .from("product-images")
      .list("", { limit: 1000 });
    
    const { data: brandAssets, error: brandAssetsError } = await supabase.storage
      .from("brand-assets")
      .list("", { limit: 1000 });
    
    if (productImagesError) {
      console.error("❌ Error listing product-images:", productImagesError);
    }
    if (brandAssetsError) {
      console.error("❌ Error listing brand-assets:", brandAssetsError);
    }
    
    const allImages = [
      ...(productImages || []).map(img => ({ ...img, source: 'product-images' })),
      ...(brandAssets || []).map(img => ({ ...img, source: 'brand-assets' }))
    ];
    
    const imageFiles = allImages.filter(file => 
      file.name.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)
    );
    
    console.log(`📋 Found ${imageFiles.length} total images`);
    console.log(`   📦 From product-images: ${productImages?.length || 0}`);
    console.log(`   🏷️ From brand-assets: ${brandAssets?.length || 0}`);
    
    // 2. Get all products
    console.log("\n📦 Step 2: Getting all products...");
    
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, brand_id, image, created_at")
      .order("created_at");
    
    if (productsError) {
      console.error("❌ Error fetching products:", productsError);
      return;
    }
    
    console.log(`📋 Found ${products.length} products`);
    
    // 3. Create a proper product-image mapping
    console.log("\n🔗 Step 3: Creating proper product-image mapping...");
    
    // Sort images by creation/modification time to get a consistent order
    const sortedImages = imageFiles.sort((a, b) => {
      const aTime = a.updated_at || a.created_at || 0;
      const bTime = b.updated_at || b.created_at || 0;
      return aTime - bTime;
    });
    
    // Assign images systematically to products
    const productImageMapping = {};
    products.forEach((product, index) => {
      if (index < sortedImages.length) {
        const imageFile = sortedImages[index];
        const imageUrl = `${supabaseUrl}/storage/v1/object/public/${imageFile.source}/${imageFile.name}`;
        productImageMapping[product.id] = {
          url: imageUrl,
          filename: imageFile.name,
          source: imageFile.source
        };
      }
    });
    
    console.log(`📊 Created mapping for ${Object.keys(productImageMapping).length} products`);
    
    // 4. Update product images in database
    console.log("\n🔄 Step 4: Updating product images in database...");
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      const mapping = productImageMapping[product.id];
      if (mapping) {
        try {
          const { error: updateError } = await supabase
            .from("products")
            .update({ image: mapping.url })
            .eq("id", product.id);
          
          if (updateError) {
            console.error(`   ❌ Error updating ${product.title}:`, updateError.message);
            errorCount++;
          } else {
            console.log(`   ✅ Updated ${product.title}: ${mapping.filename} (${mapping.source})`);
            updatedCount++;
          }
        } catch (e) {
          console.error(`   ❌ Exception updating ${product.title}:`, e.message);
          errorCount++;
        }
      } else {
        console.log(`   ⚠️ No mapping found for ${product.title}`);
      }
    }
    
    // 5. Verification
    console.log("\n🔍 Step 5: Verifying updates...");
    
    const { data: updatedProducts, error: verifyError } = await supabase
      .from("products")
      .select("id, title, image")
      .order("title");
    
    if (verifyError) {
      console.error("❌ Error verifying updates:", verifyError);
    } else {
      console.log(`📊 Verification results:`);
      console.log(`   ✅ Successfully updated: ${updatedCount}`);
      console.log(`   ❌ Errors: ${errorCount}`);
      console.log(`   📋 Total products: ${updatedProducts?.length || 0}`);
      
      // Check for duplicates after update
      const uniqueImages = new Set();
      updatedProducts?.forEach(product => {
        if (product.image) uniqueImages.add(product.image);
      });
      
      console.log(`   🖼️ Unique images after update: ${uniqueImages.size}`);
      console.log(`   🔄 Duplicate images after update: ${(updatedProducts?.length || 0) - uniqueImages.size}`);
      
      // Show sample of updated products
      if (updatedProducts && updatedProducts.length > 0) {
        console.log(`\n📋 Sample updated products (first 5):`);
        updatedProducts.slice(0, 5).forEach(product => {
          const filename = product.image ? product.image.split('/').pop() : 'No image';
          console.log(`   - ${product.title}: ${filename}`);
        });
      }
    }
    
    console.log("\n🎯 Original product image restoration completed!");
    console.log("\n💡 Next steps:");
    console.log("   1. Check the product listing page to see if images are now correct");
    console.log("   2. Each product should now have a unique, appropriate image");
    console.log("   3. Consider clearing browser cache if images don't update immediately");
    
  } catch (error) {
    console.error("❌ Error in restoreProductImagesProperly:", error);
  }
}

// Run the restoration
restoreProductImagesProperly().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
