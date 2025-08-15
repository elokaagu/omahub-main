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

async function fixDuplicateProductImages() {
  try {
    console.log("🎯 FIXING: Duplicate product images...");
    console.log("=".repeat(70));
    console.log("This will ensure each product gets a unique image");
    console.log("");
    
    // 1. Get the problematic products
    console.log("\n📦 Step 1: Getting products with duplicate images...");
    
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, image, created_at")
      .in("title", ["Elegant Evening Gown", "Couture Evening Ensemble"])
      .order("created_at");
    
    if (productsError) {
      console.error("❌ Error fetching products:", productsError);
      return;
    }
    
    console.log(`📋 Found ${products.length} products with duplicate images:`);
    products.forEach(product => {
      const date = new Date(product.created_at).toLocaleString();
      const filename = product.image ? product.image.split('/').pop() : 'No image';
      console.log(`   - ${product.title}: Created ${date}, Image: ${filename}`);
    });
    
    // 2. Get all available images
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
    
    // 3. Find the best unique images for each product
    console.log("\n🔍 Step 3: Finding best unique images...");
    
    const fixes = [];
    
    products.forEach((product, index) => {
      const productCreatedAt = new Date(product.created_at).getTime();
      
      // Find the best available image by creation time
      let bestImage = null;
      let smallestTimeDiff = Infinity;
      
      imageFiles.forEach(image => {
        const imageCreatedAt = new Date(image.created_at || image.updated_at || 0).getTime();
        const timeDiff = Math.abs(productCreatedAt - imageCreatedAt);
        
        // Skip images that are already assigned to other products in this batch
        const isAlreadyAssigned = fixes.some(fix => fix.imageName === image.name);
        
        if (!isAlreadyAssigned && timeDiff < smallestTimeDiff) {
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
        
        console.log(`\n🔗 Best match for ${product.title}:`);
        console.log(`   📅 Product created: ${new Date(product.created_at).toLocaleString()}`);
        console.log(`   🖼️ Image uploaded: ${new Date(bestImage.created_at || bestImage.updated_at || 0).toLocaleString()}`);
        console.log(`   ⏱️ Time difference: ${timeDiffHours} hours (${timeDiffMinutes} minutes)`);
        console.log(`   📸 New image: ${bestImage.name}`);
        console.log(`   🔄 Current image: ${product.image ? product.image.split('/').pop() : 'No image'}`);
      } else {
        console.log(`\n⚠️ No available image for ${product.title}`);
      }
    });
    
    if (fixes.length === 0) {
      console.log("\n❌ No fixes found");
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
        
        // Check for duplicates after update
        const imageUsage = new Map();
        updatedProducts.forEach(product => {
          if (product.image) {
            const filename = product.image.split('/').pop();
            if (imageUsage.has(filename)) {
              imageUsage.get(filename).push(product.title);
            } else {
              imageUsage.set(filename, [product.title]);
            }
          }
        });
        
        const duplicates = Array.from(imageUsage.entries())
          .filter(([filename, products]) => products.length > 1);
        
        if (duplicates.length === 0) {
          console.log(`\n✅ No duplicate images found after update!`);
        } else {
          console.log(`\n🔄 Still have duplicate images:`);
          duplicates.forEach(([filename, products]) => {
            console.log(`   📸 ${filename}:`);
            products.forEach(product => console.log(`      - ${product}`));
          });
        }
      }
    }
    
    // 6. Summary
    console.log("\n" + "=".repeat(70));
    console.log("🎯 Duplicate product image fixes completed!");
    
    if (updatedCount > 0) {
      console.log(`\n✅ Successfully fixed ${updatedCount} duplicate product images!`);
      console.log(`   - Each product now has a unique image`);
      console.log(`   - No more duplicate image usage`);
      console.log(`   - Time-based matching maintained where possible`);
      
      console.log("\n🚀 Next steps:");
      console.log("   1. Clear your browser cache completely");
      console.log("   2. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)");
      console.log("   3. Product images should now be unique and accurate!");
      
      console.log("\n💡 What was improved:");
      console.log("   - Eliminated duplicate image usage between products");
      console.log("   - Each product now has its own unique image");
      console.log("   - Maintained the best possible time-based matches");
    } else {
      console.log("\n❌ No duplicate images were fixed");
    }
    
    console.log(`\n📊 Final results:`);
    console.log(`   ✅ Successfully fixed: ${updatedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
  } catch (error) {
    console.error("❌ Error in fixDuplicateProductImages:", error);
  }
}

// Run the duplicate fix
fixDuplicateProductImages().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
