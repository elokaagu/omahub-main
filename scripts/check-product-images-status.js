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

async function checkProductImagesStatus() {
  try {
    console.log("🔍 Checking product images status...");
    console.log("=".repeat(60));
    
    // 1. Get all products with their images and creation times
    console.log("\n📦 Step 1: Getting products with images and creation times...");
    
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, image, video_url, video_thumbnail, created_at")
      .order("created_at");
    
    if (productsError) {
      console.error("❌ Error fetching products:", productsError);
      return;
    }
    
    console.log(`📋 Found ${products.length} products`);
    
    // 2. Get all images from product-images bucket
    console.log("\n🖼️ Step 2: Getting images from product-images bucket...");
    
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
    
    // 3. Analyze current product image status
    console.log("\n📊 Step 3: Analyzing product image status...");
    
    let productsWithImages = 0;
    let productsWithoutImages = 0;
    let productsWithVideos = 0;
    let productsWithThumbnails = 0;
    
    const imageIssues = [];
    const workingImages = [];
    
    products.forEach(product => {
      if (product.image) {
        productsWithImages++;
        
        // Check if the image URL is accessible
        const filename = product.image.split('/').pop();
        const imageExists = imageFiles.find(file => file.name === filename);
        
        if (imageExists) {
          workingImages.push({
            product: product.title,
            image: filename,
            size: imageExists.metadata?.size || 'unknown'
          });
        } else {
          imageIssues.push({
            product: product.title,
            issue: 'Image file not found in bucket',
            expected: filename
          });
        }
      } else {
        productsWithoutImages++;
      }
      
      if (product.video_url) productsWithVideos++;
      if (product.video_thumbnail) productsWithThumbnails++;
    });
    
    // 4. Display results
    console.log(`\n📊 Product Image Analysis:`);
    console.log(`   📦 Total products: ${products.length}`);
    console.log(`   🖼️ Products with images: ${productsWithImages}`);
    console.log(`   ❌ Products without images: ${productsWithoutImages}`);
    console.log(`   🎥 Products with videos: ${productsWithVideos}`);
    console.log(`   🖼️ Products with thumbnails: ${productsWithThumbnails}`);
    
    if (workingImages.length > 0) {
      console.log(`\n✅ Working product images (first 10):`);
      workingImages.slice(0, 10).forEach(img => {
        console.log(`   - ${img.product}: ${img.image} (${img.size} bytes)`);
      });
    }
    
    if (imageIssues.length > 0) {
      console.log(`\n❌ Image issues found (first 10):`);
      imageIssues.slice(0, 10).forEach(issue => {
        console.log(`   - ${issue.product}: ${issue.issue}`);
        if (issue.expected) {
          console.log(`     Expected: ${issue.expected}`);
        }
      });
    }
    
    // 5. Check for potential time-based mapping opportunities
    console.log("\n🔍 Step 4: Checking for time-based mapping opportunities...");
    
    const productsWithCreationTimes = products.filter(p => p.created_at);
    const imagesWithCreationTimes = imageFiles.filter(img => img.created_at || img.updated_at);
    
    console.log(`   📅 Products with creation times: ${productsWithCreationTimes.length}`);
    console.log(`   📅 Images with creation times: ${imagesWithCreationTimes.length}`);
    
    if (productsWithCreationTimes.length > 0 && imagesWithCreationTimes.length > 0) {
      console.log(`   ✅ Time-based mapping is possible!`);
      console.log(`   💡 We can match products to images based on creation time similarity`);
    } else {
      console.log(`   ⚠️ Time-based mapping may not be possible`);
    }
    
    // 6. Summary and recommendations
    console.log("\n" + "=".repeat(60));
    console.log("🎯 Product image status check completed!");
    
    if (imageIssues.length > 0) {
      console.log(`\n❌ Found ${imageIssues.length} products with image issues`);
      console.log("   This explains why some products show placeholders or broken images");
      
      console.log("\n💡 Recommended solution:");
      console.log("   - Use time-based mapping to restore correct product-image associations");
      console.log("   - Match products to images created around the same time");
      console.log("   - This should restore the original product-image relationships");
    } else {
      console.log("\n✅ All product images appear to be working correctly!");
    }
    
    console.log("\n🚀 Next steps:");
    if (imageIssues.length > 0) {
      console.log("   1. Run time-based product image mapping script");
      console.log("   2. Clear browser cache and refresh");
      console.log("   3. Product images should display correctly!");
    } else {
      console.log("   1. Product images are working - no action needed");
      console.log("   2. Check if there are other image-related issues");
    }
    
  } catch (error) {
    console.error("❌ Error in checkProductImagesStatus:", error);
  }
}

// Run the check
checkProductImagesStatus().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
