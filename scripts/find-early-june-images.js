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

async function findEarlyJuneImages() {
  try {
    console.log("🔍 FINDING: Images uploaded around June 4th...");
    console.log("=".repeat(70));
    console.log("Looking for images that might be the right ones for early June products");
    console.log("");
    
    // 1. Get the problematic products
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
    
    console.log(`📋 Found ${products.length} problematic products:`);
    products.forEach(product => {
      const date = new Date(product.created_at).toLocaleString();
      console.log(`   - ${product.title}: Created ${date}`);
    });
    
    // 2. Get all images and find ones uploaded around June 4th
    console.log("\n🖼️ Step 2: Finding images uploaded around June 4th...");
    
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
    
    console.log(`🖼️ Found ${imageFiles.length} total images`);
    
    // Target date: June 4th, 2025
    const targetDate = new Date('2025-06-04T12:00:00Z'); // Midday on June 4th
    const targetTime = targetDate.getTime();
    
    // Look for images within 3 days of June 4th
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    
    const earlyJuneImages = [];
    const otherImages = [];
    
    imageFiles.forEach(image => {
      const imageCreatedAt = new Date(image.created_at || image.updated_at || 0).getTime();
      const timeDiff = Math.abs(imageCreatedAt - targetTime);
      
      if (timeDiff <= threeDaysInMs) {
        earlyJuneImages.push({
          name: image.name,
          created_at: image.created_at || image.updated_at,
          timeDiff: timeDiff,
          timeDiffHours: Math.round(timeDiff / 1000 / 1000 / 60),
          timeDiffDays: Math.round(timeDiff / 1000 / 1000 / 60 / 24),
          size: image.metadata?.size || 'unknown'
        });
      } else {
        otherImages.push({
          name: image.name,
          created_at: image.created_at || image.updated_at,
          timeDiff: timeDiff,
          timeDiffDays: Math.round(timeDiff / 1000 / 1000 / 60 / 24)
        });
      }
    });
    
    // Sort by time difference
    earlyJuneImages.sort((a, b) => a.timeDiff - b.timeDiff);
    otherImages.sort((a, b) => a.timeDiff - b.timeDiff);
    
    console.log(`\n📅 Images uploaded around June 4th (±3 days): ${earlyJuneImages.length}`);
    console.log(`📅 Other images: ${otherImages.length}`);
    
    if (earlyJuneImages.length > 0) {
      console.log(`\n🎯 Best matches for June 4th products:`);
      earlyJuneImages.slice(0, 10).forEach((image, index) => {
        const date = new Date(image.created_at).toLocaleString();
        console.log(`   ${index + 1}. ${image.name}`);
        console.log(`      📅 Uploaded: ${date}`);
        console.log(`      ⏱️ Time diff: ${image.timeDiffDays} days (${image.timeDiffHours} hours)`);
        console.log(`      📏 Size: ${image.size} bytes`);
        console.log(`      🔗 URL: ${supabaseUrl}/storage/v1/object/public/product-images/${image.name}`);
        console.log("");
      });
      
      // Check if any of these images are currently unused
      const unusedEarlyImages = earlyJuneImages.filter(image => {
        return !products.some(product => 
          product.image && product.image.includes(image.name)
        );
      });
      
      if (unusedEarlyImages.length > 0) {
        console.log(`\n✅ Found ${unusedEarlyImages.length} unused early June images!`);
        console.log(`   These would be perfect for the problematic products`);
        
        console.log(`\n💡 Recommendation:`);
        console.log(`   - Use these early June images for the problematic products`);
        console.log(`   - This will give them much better time-based matches`);
        console.log(`   - The 8-hour difference will become just a few days`);
        
        console.log(`\n🚀 To fix this, manually update the products:`);
        unusedEarlyImages.slice(0, 3).forEach((image, index) => {
          console.log(`   ${index + 1}. Elegant Evening Gown → ${image.name}`);
          console.log(`      URL: ${supabaseUrl}/storage/v1/object/public/product-images/${image.name}`);
        });
      } else {
        console.log(`\n⚠️ All early June images are already in use`);
        console.log(`   We'll need to find the next best alternatives`);
      }
    } else {
      console.log(`\n❌ No images found around June 4th`);
      console.log(`   This explains why the products have 8-hour differences`);
      console.log(`   The earliest images were uploaded much later`);
    }
    
    // 3. Show current image assignments
    console.log("\n🔍 Step 3: Current problematic assignments...");
    
    products.forEach(product => {
      const currentImage = product.image ? product.image.split('/').pop() : 'No image';
      const productDate = new Date(product.created_at).toLocaleString();
      
      console.log(`\n📦 ${product.title}:`);
      console.log(`   📅 Created: ${productDate}`);
      console.log(`   🖼️ Current image: ${currentImage}`);
      
      // Find the current image details
      const currentImageFile = imageFiles.find(img => img.name === currentImage);
      if (currentImageFile) {
        const imageDate = new Date(currentImageFile.created_at || currentImageFile.updated_at || 0).toLocaleString();
        const timeDiff = Math.abs(new Date(product.created_at).getTime() - new Date(currentImageFile.created_at || currentImageFile.updated_at || 0).getTime());
        const timeDiffDays = Math.round(timeDiff / 1000 / 1000 / 60 / 24);
        
        console.log(`   📅 Image uploaded: ${imageDate}`);
        console.log(`   ⏱️ Time difference: ${timeDiffDays} days`);
        console.log(`   📏 Size: ${currentImageFile.metadata?.size || 'unknown'} bytes`);
      }
    });
    
    // 4. Summary and recommendations
    console.log("\n" + "=".repeat(70));
    console.log("🎯 Early June image analysis completed!");
    
    if (earlyJuneImages.length > 0 && unusedEarlyImages.length > 0) {
      console.log(`\n✅ Found ${unusedEarlyImages.length} perfect early June images!`);
      console.log(`   These will fix the problematic products with much better time matches`);
      
      console.log("\n🚀 Next steps:");
      console.log("   1. Manually update the problematic products with early June images");
      console.log("   2. This will reduce time differences from 8 hours to a few days");
      console.log("   3. Product images will be much more accurate!");
    } else {
      console.log(`\n⚠️ No perfect early June images found`);
      console.log(`   The current 8-hour differences are the best we can do with available images`);
      console.log(`   The products were created before most images were uploaded`);
    }
    
    console.log(`\n📊 Final analysis:`);
    console.log(`   🎯 Early June images found: ${earlyJuneImages.length}`);
    console.log(`   ✅ Unused early images: ${unusedEarlyImages?.length || 0}`);
    console.log(`   📦 Problematic products: ${products.length}`);
    
  } catch (error) {
    console.error("❌ Error in findEarlyJuneImages:", error);
  }
}

// Run the analysis
findEarlyJuneImages().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
