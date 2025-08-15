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

async function verifyProductImageAccuracy() {
  try {
    console.log("🔍 VERIFYING: Product image accuracy and associations...");
    console.log("=".repeat(70));
    console.log("This will check if products have the right images");
    console.log("");
    
    // 1. Get all products with their current images and creation times
    console.log("\n📦 Step 1: Getting products with current images...");
    
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, image, video_url, video_thumbnail, created_at, brand_id")
      .order("created_at");
    
    if (productsError) {
      console.error("❌ Error fetching products:", productsError);
      return;
    }
    
    console.log(`📋 Found ${products.length} products`);
    
    // 2. Get all images from product-images bucket with creation times
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
    
    // 3. Analyze current product-image associations
    console.log("\n🔍 Step 3: Analyzing current product-image associations...");
    
    const suspiciousAssociations = [];
    const goodAssociations = [];
    const duplicateImages = new Map();
    
    products.forEach(product => {
      if (product.image) {
        const filename = product.image.split('/').pop();
        const imageFile = imageFiles.find(file => file.name === filename);
        
        if (imageFile) {
          const productCreatedAt = new Date(product.created_at).getTime();
          const imageCreatedAt = new Date(imageFile.created_at || imageFile.updated_at || 0).getTime();
          const timeDiff = Math.abs(productCreatedAt - imageCreatedAt);
          
          // Check for duplicate image usage
          if (duplicateImages.has(filename)) {
            duplicateImages.get(filename).push(product.title);
          } else {
            duplicateImages.set(filename, [product.title]);
          }
          
          // Categorize associations
          if (timeDiff <= 60 * 60 * 1000) { // Within 1 hour
            goodAssociations.push({
              product: product.title,
              image: filename,
              timeDiff: timeDiff,
              timeDiffMinutes: Math.round(timeDiff / 1000 / 60)
            });
          } else {
            suspiciousAssociations.push({
              product: product.title,
              image: filename,
              timeDiff: timeDiff,
              timeDiffMinutes: Math.round(timeDiff / 1000 / 1000 / 60), // Convert to hours
              timeDiffHours: Math.round(timeDiff / 1000 / 1000 / 60)
            });
          }
        }
      }
    });
    
    // 4. Display analysis results
    console.log(`\n📊 Product Image Association Analysis:`);
    console.log(`   ✅ Good associations (≤1 hour): ${goodAssociations.length}`);
    console.log(`   ⚠️ Suspicious associations (>1 hour): ${suspiciousAssociations.length}`);
    
    // Check for duplicate images
    const actualDuplicates = Array.from(duplicateImages.entries())
      .filter(([filename, products]) => products.length > 1);
    
    console.log(`   🔄 Duplicate images used: ${actualDuplicates.length}`);
    
    if (goodAssociations.length > 0) {
      console.log(`\n✅ Good product-image associations (first 10):`);
      goodAssociations.slice(0, 10).forEach(assoc => {
        console.log(`   - ${assoc.product}: ${assoc.image} (${assoc.timeDiffMinutes} min diff)`);
      });
    }
    
    if (suspiciousAssociations.length > 0) {
      console.log(`\n⚠️ Suspicious product-image associations (first 15):`);
      suspiciousAssociations.slice(0, 15).forEach(assoc => {
        console.log(`   - ${assoc.product}: ${assoc.image} (${assoc.timeDiffHours} hours diff)`);
      });
    }
    
    if (actualDuplicates.length > 0) {
      console.log(`\n🔄 Products sharing the same images:`);
      actualDuplicates.slice(0, 10).forEach(([filename, products]) => {
        console.log(`   📸 ${filename}:`);
        products.forEach(product => console.log(`      - ${product}`));
      });
    }
    
    // 5. Check if we need to re-run the time-based mapping
    console.log("\n🔍 Step 4: Checking if re-mapping is needed...");
    
    if (suspiciousAssociations.length > 0) {
      console.log(`\n❌ Found ${suspiciousAssociations.length} suspicious associations!`);
      console.log("   This suggests the time-based mapping may not have worked correctly");
      console.log("   or the images are still mismatched.");
      
      console.log("\n💡 Recommended action:");
      console.log("   - Re-run the time-based product image mapping script");
      console.log("   - This should fix the mismatched product images");
      
      console.log("\n🚀 To fix this, run:");
      console.log("   node scripts/fix-product-images-by-creation-time.js");
    } else if (actualDuplicates.length > 0) {
      console.log(`\n⚠️ Found ${actualDuplicates.length} duplicate image usages!`);
      console.log("   Multiple products are sharing the same images");
      console.log("   This might indicate incorrect associations.");
      
      console.log("\n💡 Recommended action:");
      console.log("   - Re-run the time-based mapping to ensure unique assignments");
    } else {
      console.log(`\n✅ All product images appear to be correctly associated!`);
      console.log("   - Good time-based matches");
      console.log("   - No suspicious associations");
      console.log("   - No duplicate images");
    }
    
    // 6. Summary and recommendations
    console.log("\n" + "=".repeat(70));
    console.log("🎯 Product image accuracy verification completed!");
    
    if (suspiciousAssociations.length > 0) {
      console.log(`\n❌ Found ${suspiciousAssociations.length} products with potentially wrong images`);
      console.log("   The time-based mapping may need to be re-run");
      
      console.log("\n🚀 Next steps:");
      console.log("   1. Run the time-based mapping script again");
      console.log("   2. Clear browser cache and refresh");
      console.log("   3. Product images should now be accurate!");
    } else {
      console.log("\n✅ Product images appear to be correctly associated!");
      console.log("   If you're still seeing wrong images, it might be a caching issue");
      
      console.log("\n🚀 Next steps:");
      console.log("   1. Clear browser cache completely");
      console.log("   2. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)");
      console.log("   3. Check if images are now correct");
    }
    
    console.log(`\n📊 Final analysis:`);
    console.log(`   ✅ Good associations: ${goodAssociations.length}`);
    console.log(`   ⚠️ Suspicious: ${suspiciousAssociations.length}`);
    console.log(`   🔄 Duplicates: ${actualDuplicates.length}`);
    
  } catch (error) {
    console.error("❌ Error in verifyProductImageAccuracy:", error);
  }
}

// Run the verification
verifyProductImageAccuracy().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
