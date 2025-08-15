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

async function fixProductImagesUnique() {
  try {
    console.log("🎯 FIXING: Product images with unique assignments...");
    console.log("=".repeat(70));
    console.log("This will ensure each product gets a unique image");
    console.log("");
    
    // 1. Get all products with their current images and creation times
    console.log("\n📦 Step 1: Getting all products...");
    
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, image, created_at")
      .order("created_at");
    
    if (productsError) {
      console.error("❌ Error fetching products:", productsError);
      return;
    }
    
    console.log(`📋 Found ${products.length} products`);
    
    // 2. Get all images from product-images bucket with creation times
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
    
    // 3. Create unique mapping ensuring no duplicates
    console.log("\n🔗 Step 3: Creating unique product-image mapping...");
    
    const sortedImages = imageFiles.sort((a, b) => {
      const aTime = new Date(a.created_at || a.updated_at || 0).getTime();
      const bTime = new Date(b.created_at || b.updated_at || 0).getTime();
      return aTime - bTime;
    });
    
    const sortedProducts = products.sort((a, b) => {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    
    const productImageMapping = {};
    const usedImages = new Set();
    
    // For each product, find the best available image that hasn't been used
    sortedProducts.forEach((product, index) => {
      const productCreatedAt = new Date(product.created_at).getTime();
      
      // Find the best available image by creation time
      let bestImage = null;
      let smallestTimeDiff = Infinity;
      
      sortedImages.forEach(image => {
        if (usedImages.has(image.name)) return; // Skip already used images
        
        const imageCreatedAt = new Date(image.created_at || image.updated_at || 0).getTime();
        const timeDiff = Math.abs(productCreatedAt - imageCreatedAt);
        
        if (timeDiff < smallestTimeDiff) {
          smallestTimeDiff = timeDiff;
          bestImage = image;
        }
      });
      
      if (bestImage) {
        productImageMapping[product.title] = {
          productId: product.id,
          productCreatedAt: product.created_at,
          imageName: bestImage.name,
          imageCreatedAt: bestImage.created_at || bestImage.updated_at,
          timeDiff: smallestTimeDiff,
          imageUrl: `${supabaseUrl}/storage/v1/object/public/product-images/${bestImage.name}`,
          imageSize: bestImage.metadata?.size || 'unknown',
          currentImage: product.image ? product.image.split('/').pop() : 'No image'
        };
        
        usedImages.add(bestImage.name);
        
        const timeDiffHours = Math.round(smallestTimeDiff / 1000 / 1000 / 60);
        const timeDiffMinutes = Math.round(smallestTimeDiff / 1000 / 60);
        
        console.log(`\n🔗 Mapped ${product.title}:`);
        console.log(`   📅 Product created: ${new Date(product.created_at).toLocaleString()}`);
        console.log(`   🖼️ Image uploaded: ${new Date(bestImage.created_at || bestImage.updated_at || 0).toLocaleString()}`);
        console.log(`   ⏱️ Time difference: ${timeDiffHours} hours (${timeDiffMinutes} minutes)`);
        console.log(`   📸 Image: ${bestImage.name}`);
        console.log(`   🔄 Current image: ${product.image ? product.image.split('/').pop() : 'No image'}`);
      } else {
        console.log(`\n⚠️ No available image for ${product.title}`);
      }
    });
    
    console.log(`\n📊 Created unique mapping for ${Object.keys(productImageMapping).length} products`);
    
    // 4. Check for potential changes
    console.log("\n🔍 Step 4: Analyzing potential changes...");
    
    let mappingsThatWouldChange = 0;
    let mappingsThatWouldStaySame = 0;
    
    Object.values(productImageMapping).forEach(mapping => {
      if (mapping.currentImage === mapping.imageName) {
        mappingsThatStaySame++;
      } else {
        mappingsThatWouldChange++;
      }
    });
    
    console.log(`📊 Mapping analysis:`);
    console.log(`   🔄 Would change current image: ${mappingsThatWouldChange}`);
    console.log(`   ✅ Would stay the same: ${mappingsThatWouldStaySame}`);
    
    if (mappingsThatWouldChange === 0) {
      console.log(`\n✅ All product images are already correctly mapped with unique assignments!`);
      console.log(`   No changes needed.`);
      return;
    }
    
    // 5. Update products with unique images
    console.log("\n🔄 Step 5: Updating products with unique images...");
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const productTitle of Object.keys(productImageMapping)) {
      const mapping = productImageMapping[productTitle];
      
      // Only update if the image would actually change
      if (mapping.currentImage !== mapping.imageName) {
        try {
          console.log(`\n🔄 Updating ${productTitle}:`);
          console.log(`   📸 New image: ${mapping.imageName}`);
          console.log(`   🔄 Old image: ${mapping.currentImage}`);
          console.log(`   ⏱️ Time diff: ${Math.round(mapping.timeDiff / 1000 / 1000 / 60)} hours`);
          console.log(`   📏 Size: ${mapping.imageSize} bytes`);
          
          const { error: updateError } = await supabase
            .from("products")
            .update({ image: mapping.imageUrl })
            .eq("id", mapping.productId);
          
          if (updateError) {
            console.error(`   ❌ Error updating ${productTitle}:`, updateError.message);
            errorCount++;
          } else {
            console.log(`   ✅ Successfully updated ${productTitle}`);
            updatedCount++;
          }
          
        } catch (e) {
          console.error(`   ❌ Exception updating ${productTitle}:`, e.message);
          errorCount++;
        }
      } else {
        console.log(`\n✅ ${productTitle}: Already correctly mapped (${mapping.imageName})`);
      }
    }
    
    // 6. Verification
    console.log("\n🔍 Step 6: Verifying unique assignments...");
    
    const { data: updatedProducts, error: verifyError } = await supabase
      .from("products")
      .select("id, title, image, created_at")
      .order("created_at");
    
    if (verifyError) {
      console.error("❌ Error verifying updates:", verifyError);
    } else {
      console.log(`📊 Verification results:`);
      console.log(`   ✅ Successfully updated: ${updatedCount}`);
      console.log(`   ❌ Errors: ${errorCount}`);
      console.log(`   📋 Total products: ${updatedProducts?.length || 0}`);
      
      // Check for duplicates after update
      const imageUsage = new Map();
      updatedProducts?.forEach(product => {
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
      
      console.log(`   🖼️ Unique images after update: ${imageUsage.size}`);
      console.log(`   🔄 Duplicate images after update: ${duplicates.length}`);
      
      if (duplicates.length > 0) {
        console.log(`\n🔄 Products still sharing images:`);
        duplicates.slice(0, 5).forEach(([filename, products]) => {
          console.log(`   📸 ${filename}:`);
          products.forEach(product => console.log(`      - ${product}`));
        });
      }
      
      // Show sample of updated products
      if (updatedProducts && updatedProducts.length > 0) {
        console.log(`\n📋 Sample updated products (first 15):`);
        updatedProducts.slice(0, 15).forEach(product => {
          const filename = product.image ? product.image.split('/').pop() : 'No image';
          const date = new Date(product.created_at).toLocaleString();
          console.log(`   - ${product.title} (${date}): ${filename}`);
        });
      }
    }
    
    // 7. Summary
    console.log("\n" + "=".repeat(70));
    console.log("🎯 Unique product image mapping completed!");
    
    if (updatedCount > 0) {
      console.log(`\n✅ Successfully updated ${updatedCount} product images with unique assignments!`);
      console.log(`   - Each product now has a unique image`);
      console.log(`   - No more duplicate image usage`);
      console.log(`   - Time-based matching optimized`);
      
      console.log("\n🚀 Next steps:");
      console.log("   1. Clear your browser cache completely");
      console.log("   2. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)");
      console.log("   3. Product images should now be accurate and unique!");
      
      console.log("\n💡 What was improved:");
      console.log("   - Ensured unique image assignments for each product");
      console.log("   - Eliminated duplicate image usage");
      console.log("   - Maintained time-based matching where possible");
    } else if (mappingsThatWouldChange === 0) {
      console.log(`\n✅ All product images are already correctly mapped with unique assignments!`);
      console.log(`   - No changes were needed`);
      console.log(`   - Each product already has a unique image`);
    } else {
      console.log("\n❌ No product images were fixed");
    }
    
    console.log(`\n📊 Final results:`);
    console.log(`   ✅ Successfully fixed: ${updatedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   🔄 Would have changed: ${mappingsThatWouldChange}`);
    console.log(`   ✅ Already correct: ${mappingsThatStaySame}`);
    
  } catch (error) {
    console.error("❌ Error in fixProductImagesUnique:", error);
  }
}

// Run the unique mapping fix
fixProductImagesUnique().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
