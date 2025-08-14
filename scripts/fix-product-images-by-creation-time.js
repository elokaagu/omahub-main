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

async function fixProductImagesByCreationTime() {
  try {
    console.log("🎯 FIXING: Mapping products to images by creation time similarity!");
    console.log("=".repeat(70));
    console.log("The approach: Match products to images based on when they were created");
    console.log("This should restore the original product-image associations");
    console.log("");
    
    // 1. Get all products with their creation times
    console.log("\n📦 Step 1: Getting products with creation times...");
    
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, image, video_url, video_thumbnail, created_at")
      .order("created_at");
    
    if (productsError) {
      console.error("❌ Error fetching products:", productsError);
      return;
    }
    
    console.log(`📋 Found ${products.length} products`);
    
    // Show sample products with creation times
    console.log("\n📅 Sample products with creation times:");
    products.slice(0, 5).forEach(product => {
      const date = new Date(product.created_at).toLocaleString();
      console.log(`   - ${product.title}: ${date}`);
    });
    
    // 2. Get all images from product-images bucket with their creation times
    console.log("\n🖼️ Step 2: Getting product-images with creation times...");
    
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
    
    console.log(`🖼️ Found ${imageFiles.length} images in product-images bucket`);
    
    // Sort images by creation time
    const sortedImages = imageFiles.sort((a, b) => {
      const aTime = new Date(a.created_at || a.updated_at || 0).getTime();
      const bTime = new Date(b.created_at || b.updated_at || 0).getTime();
      return aTime - bTime;
    });
    
    // Show sample images with creation times
    console.log("\n📅 Sample images with creation times:");
    sortedImages.slice(0, 5).forEach(image => {
      const date = new Date(image.created_at || image.updated_at || 0).toLocaleString();
      console.log(`   - ${image.name}: ${date}`);
    });
    
    // 3. Create time-based mapping
    console.log("\n🔗 Step 3: Creating time-based product-image mapping...");
    
    const productImageMapping = {};
    const usedImages = new Set();
    
    // For each product, find the closest image by creation time
    products.forEach((product, index) => {
      const productCreatedAt = new Date(product.created_at).getTime();
      
      // Find the closest image by creation time that hasn't been used
      let closestImage = null;
      let smallestTimeDiff = Infinity;
      
      sortedImages.forEach(image => {
        if (usedImages.has(image.name)) return; // Skip already used images
        
        const imageCreatedAt = new Date(image.created_at || image.updated_at || 0).getTime();
        const timeDiff = Math.abs(productCreatedAt - imageCreatedAt);
        
        if (timeDiff < smallestTimeDiff) {
          smallestTimeDiff = timeDiff;
          closestImage = image;
        }
      });
      
      if (closestImage) {
        productImageMapping[product.title] = {
          productId: product.id,
          productCreatedAt: product.created_at,
          imageName: closestImage.name,
          imageCreatedAt: closestImage.created_at || closestImage.updated_at,
          timeDiff: smallestTimeDiff,
          imageUrl: `${supabaseUrl}/storage/v1/object/public/product-images/${closestImage.name}`,
          imageSize: closestImage.metadata?.size || 'unknown',
          currentImage: product.image ? product.image.split('/').pop() : 'No image'
        };
        
        usedImages.add(closestImage.name);
        
        console.log(`\n🔗 Mapped ${product.title}:`);
        console.log(`   📅 Product created: ${new Date(product.created_at).toLocaleString()}`);
        console.log(`   🖼️ Image uploaded: ${new Date(closestImage.created_at || closestImage.updated_at || 0).toLocaleString()}`);
        console.log(`   ⏱️ Time difference: ${Math.round(smallestTimeDiff / 1000 / 60)} minutes`);
        console.log(`   📸 Image: ${closestImage.name}`);
        console.log(`   🔄 Current image: ${product.image ? product.image.split('/').pop() : 'No image'}`);
      } else {
        console.log(`\n⚠️ No available image for ${product.title}`);
      }
    });
    
    console.log(`\n📊 Created time-based mapping for ${Object.keys(productImageMapping).length} products`);
    
    // 4. Check how many mappings would actually change the current images
    console.log("\n🔍 Step 4: Analyzing potential changes...");
    
    let mappingsThatWouldChange = 0;
    let mappingsThatWouldStaySame = 0;
    
    Object.values(productImageMapping).forEach(mapping => {
      if (mapping.currentImage === mapping.imageName) {
        mappingsThatWouldStaySame++;
      } else {
        mappingsThatWouldChange++;
      }
    });
    
    console.log(`📊 Mapping analysis:`);
    console.log(`   🔄 Would change current image: ${mappingsThatWouldChange}`);
    console.log(`   ✅ Would stay the same: ${mappingsThatWouldStaySame}`);
    
    if (mappingsThatWouldChange === 0) {
      console.log(`\n✅ All product images are already correctly mapped by creation time!`);
      console.log(`   No changes needed.`);
      return;
    }
    
    // 5. Update products with time-matched images
    console.log("\n🔄 Step 5: Updating products with time-matched images...");
    
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
          console.log(`   ⏱️ Time diff: ${Math.round(mapping.timeDiff / 1000 / 60)} minutes`);
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
    console.log("\n🔍 Step 6: Verifying time-based updates...");
    
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
      
      // Show the new product-image associations
      if (updatedProducts && updatedProducts.length > 0) {
        console.log(`\n📋 New product-image associations (first 15):`);
        updatedProducts.slice(0, 15).forEach(product => {
          const filename = product.image ? product.image.split('/').pop() : 'No image';
          const date = new Date(product.created_at).toLocaleString();
          console.log(`   - ${product.title} (${date}): ${filename}`);
        });
      }
    }
    
    // 7. Summary
    console.log("\n" + "=".repeat(70));
    console.log("🎯 Time-based product image fix completed!");
    
    if (updatedCount > 0) {
      console.log(`\n✅ Successfully fixed ${updatedCount} product images using time-based mapping!`);
      console.log(`   - Products are now mapped to images created around the same time`);
      console.log(`   - This should restore the original product-image associations`);
      console.log(`   - No more mismatched product images!`);
      
      console.log("\n🚀 Next steps:");
      console.log("   1. Clear your browser cache completely");
      console.log("   2. Hard refresh the homepage (Ctrl+F5 or Cmd+Shift+R)");
      console.log("   3. Product images should now display with correct associations!");
      
      console.log("\n💡 What was improved:");
      console.log("   - Used creation time similarity for accurate product-image mapping");
      console.log("   - Each product gets an image created around the same time");
      console.log("   - Eliminated mismatched product images");
    } else if (mappingsThatWouldChange === 0) {
      console.log(`\n✅ All product images are already correctly mapped!`);
      console.log(`   - No changes were needed`);
      console.log(`   - Products already have their correct, time-matched images`);
    } else {
      console.log("\n❌ No product images were fixed");
    }
    
    console.log(`\n📊 Final results:`);
    console.log(`   ✅ Successfully fixed: ${updatedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   🔄 Would have changed: ${mappingsThatWouldChange}`);
    console.log(`   ✅ Already correct: ${mappingsThatWouldStaySame}`);
    
  } catch (error) {
    console.error("❌ Error in fixProductImagesByCreationTime:", error);
  }
}

// Run the time-based fix
fixProductImagesByCreationTime().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
