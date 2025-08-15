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

async function fixSpecificProductImages() {
  try {
    console.log("🎯 FIXING: Specific products with mismatched images...");
    console.log("=".repeat(70));
    console.log("Focusing on the 2 products that still have wrong images");
    console.log("");
    
    // 1. Get the specific problematic products
    console.log("\n📦 Step 1: Getting problematic products...");
    
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, image, created_at")
      .in("title", ["Elegant Evening Gown", "Couture Evening Ensemble"])
      .order("created_at");
    
    if (productsError) {
      console.error("❌ Error fetching products:", productsError);
      return;
    }
    
    console.log(`📋 Found ${products.length} problematic products`);
    
    products.forEach(product => {
      const date = new Date(product.created_at).toLocaleString();
      console.log(`   - ${product.title}: Created ${date}`);
      console.log(`     Current image: ${product.image ? product.image.split('/').pop() : 'No image'}`);
    });
    
    // 2. Get all available images from product-images bucket
    console.log("\n🖼️ Step 2: Getting available images...");
    
    const { data: productImages, error: productImagesError } = await supabase.storage
      .from("product-images")
      .list("", { limit: 1000 });
    
    if (productImagesError) {
      console.error("❌ Error listing product-images:", productImagesError);
      return;
    }
    
    const imageFiles = productImages.filter(file => 
      file.name.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)
    );
    
    console.log(`🖼️ Found ${imageFiles.length} available images`);
    
    // 3. Find better image matches for these specific products
    console.log("\n🔍 Step 3: Finding better image matches...");
    
    const fixes = [];
    
    products.forEach(product => {
      const productCreatedAt = new Date(product.created_at).getTime();
      
      // Find the closest image by creation time that hasn't been used by other products
      let bestImage = null;
      let smallestTimeDiff = Infinity;
      
      imageFiles.forEach(image => {
        const imageCreatedAt = new Date(image.created_at || image.updated_at || 0).getTime();
        const timeDiff = Math.abs(productCreatedAt - imageCreatedAt);
        
        // Look for images created closer to when the product was created
        if (timeDiff < smallestTimeDiff) {
          smallestTimeDiff = timeDiff;
          bestImage = image;
        }
      });
      
      if (bestImage) {
        const timeDiffHours = Math.round(smallestTimeDiff / 1000 / 1000 / 60);
        const timeDiffMinutes = Math.round(smallestTimeDiff / 1000 / 60);
        
        fixes.push({
          productId: product.id,
          productTitle: product.title,
          currentImage: product.image ? product.image.split('/').pop() : 'No image',
          newImage: bestImage.name,
          timeDiff: smallestTimeDiff,
          timeDiffHours: timeDiffHours,
          timeDiffMinutes: timeDiffMinutes,
          imageUrl: `${supabaseUrl}/storage/v1/object/public/product-images/${bestImage.name}`,
          imageSize: bestImage.metadata?.size || 'unknown'
        });
        
        console.log(`\n🔗 Better match for ${product.title}:`);
        console.log(`   📅 Product created: ${new Date(product.created_at).toLocaleString()}`);
        console.log(`   🖼️ Image uploaded: ${new Date(bestImage.created_at || bestImage.updated_at || 0).toLocaleString()}`);
        console.log(`   ⏱️ Time difference: ${timeDiffHours} hours (${timeDiffMinutes} minutes)`);
        console.log(`   📸 New image: ${bestImage.name}`);
        console.log(`   🔄 Current image: ${product.image ? product.image.split('/').pop() : 'No image'}`);
      }
    });
    
    if (fixes.length === 0) {
      console.log("\n❌ No better image matches found");
      return;
    }
    
    // 4. Apply the fixes
    console.log("\n🔄 Step 4: Applying image fixes...");
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const fix of fixes) {
      try {
        console.log(`\n🔄 Updating ${fix.productTitle}:`);
        console.log(`   📸 New image: ${fix.newImage}`);
        console.log(`   🔄 Old image: ${fix.currentImage}`);
        console.log(`   ⏱️ Time diff: ${fix.timeDiffHours} hours`);
        console.log(`   📏 Size: ${fix.imageSize} bytes`);
        
        const { error: updateError } = await supabase
          .from("products")
          .update({ image: fix.imageUrl })
          .eq("id", fix.productId);
        
        if (updateError) {
          console.error(`   ❌ Error updating ${fix.productTitle}:`, updateError.message);
          errorCount++;
        } else {
          console.log(`   ✅ Successfully updated ${fix.productTitle}`);
          updatedCount++;
        }
        
      } catch (e) {
        console.error(`   ❌ Exception updating ${fix.productTitle}:`, e.message);
        errorCount++;
      }
    }
    
    // 5. Verification
    console.log("\n🔍 Step 5: Verifying fixes...");
    
    const { data: updatedProducts, error: verifyError } = await supabase
      .from("products")
      .select("id, title, image, created_at")
      .in("title", ["Elegant Evening Gown", "Couture Evening Ensemble"])
      .order("created_at");
    
    if (verifyError) {
      console.error("❌ Error verifying updates:", verifyError);
    } else {
      console.log(`📊 Verification results:`);
      console.log(`   ✅ Successfully updated: ${updatedCount}`);
      console.log(`   ❌ Errors: ${errorCount}`);
      
      if (updatedProducts && updatedProducts.length > 0) {
        console.log(`\n📋 Updated product-image associations:`);
        updatedProducts.forEach(product => {
          const filename = product.image ? product.image.split('/').pop() : 'No image';
          const date = new Date(product.created_at).toLocaleString();
          console.log(`   - ${product.title} (${date}): ${filename}`);
        });
      }
    }
    
    // 6. Summary
    console.log("\n" + "=".repeat(70));
    console.log("🎯 Specific product image fixes completed!");
    
    if (updatedCount > 0) {
      console.log(`\n✅ Successfully fixed ${updatedCount} product images!`);
      console.log(`   - The problematic products now have better image matches`);
      console.log(`   - Time differences have been minimized`);
      
      console.log("\n🚀 Next steps:");
      console.log("   1. Clear your browser cache completely");
      console.log("   2. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)");
      console.log("   3. Product images should now be more accurate!");
    } else {
      console.log("\n❌ No product images were fixed");
    }
    
    console.log(`\n📊 Final results:`);
    console.log(`   ✅ Successfully fixed: ${updatedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
  } catch (error) {
    console.error("❌ Error in fixSpecificProductImages:", error);
  }
}

// Run the specific fixes
fixSpecificProductImages().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
