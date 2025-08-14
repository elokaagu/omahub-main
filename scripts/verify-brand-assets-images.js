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

async function verifyBrandAssetsImages() {
  try {
    console.log("🔍 Verifying brand-assets bucket images...");
    console.log("=".repeat(60));
    
    // 1. Get all images from brand-assets bucket
    console.log("\n📦 Step 1: Getting all images from brand-assets bucket...");
    
    const { data: brandAssets, error: brandAssetsError } = await supabase.storage
      .from("brand-assets")
      .list("", { limit: 1000 });
    
    if (brandAssetsError) {
      console.error("❌ Error listing brand-assets:", brandAssetsError);
      return;
    }
    
    const imageFiles = brandAssets.filter(file => 
      file.name.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)
    );
    
    console.log(`🖼️ Found ${imageFiles.length} images in brand-assets bucket`);
    
    // 2. Get brands and their expected images
    console.log("\n🏷️ Step 2: Getting brands and their expected images...");
    
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image")
      .order("name");
    
    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }
    
    console.log(`📋 Found ${brands.length} brands in database`);
    
    // 3. Check which expected images actually exist
    console.log("\n🔍 Step 3: Checking image existence...");
    
    const missingImages = [];
    const existingImages = [];
    
    brands.forEach(brand => {
      if (brand.image) {
        // Extract filename from URL
        const filename = brand.image.split('/').pop();
        
        // Check if this file exists in brand-assets
        const fileExists = imageFiles.find(file => file.name === filename);
        
        if (fileExists) {
          existingImages.push({
            brand: brand.name,
            filename: filename,
            size: fileExists.metadata?.size || 'unknown'
          });
        } else {
          missingImages.push({
            brand: brand.name,
            expected: filename,
            actualFiles: imageFiles.filter(file => 
              file.name.includes(filename.split('_')[0]) || 
              file.name.includes(filename.split('_')[1])
            ).map(f => f.name)
          });
        }
      }
    });
    
    // 4. Display results
    console.log(`\n📊 Results:`);
    console.log(`   ✅ Images found: ${existingImages.length}`);
    console.log(`   ❌ Images missing: ${missingImages.length}`);
    
    if (existingImages.length > 0) {
      console.log(`\n✅ Found images (first 10):`);
      existingImages.slice(0, 10).forEach(img => {
        console.log(`   - ${img.brand}: ${img.filename} (${img.size} bytes)`);
      });
    }
    
    if (missingImages.length > 0) {
      console.log(`\n❌ Missing images (first 10):`);
      missingImages.slice(0, 10).forEach(img => {
        console.log(`   - ${img.brand}: Expected ${img.expected}`);
        if (img.actualFiles.length > 0) {
          console.log(`     Similar files found: ${img.actualFiles.slice(0, 3).join(', ')}`);
        }
      });
    }
    
    // 5. Check if there are any obvious filename mismatches
    console.log("\n🔍 Step 4: Checking for filename mismatches...");
    
    const filenameMismatches = [];
    
    missingImages.forEach(missing => {
      const expectedParts = missing.expected.split('_');
      const prefix = expectedParts[0];
      const timestamp = expectedParts[1];
      
      // Look for files with similar patterns
      const similarFiles = imageFiles.filter(file => 
        file.name.includes(prefix) || 
        file.name.includes(timestamp?.split('.')[0])
      );
      
      if (similarFiles.length > 0) {
        filenameMismatches.push({
          brand: missing.brand,
          expected: missing.expected,
          similar: similarFiles.map(f => f.name)
        });
      }
    });
    
    if (filenameMismatches.length > 0) {
      console.log(`\n🔍 Found ${filenameMismatches.length} potential filename mismatches:`);
      filenameMismatches.slice(0, 5).forEach(mismatch => {
        console.log(`   - ${mismatch.brand}:`);
        console.log(`     Expected: ${mismatch.expected}`);
        console.log(`     Similar: ${mismatch.similar.slice(0, 3).join(', ')}`);
      });
    }
    
    // 6. Summary and recommendations
    console.log("\n" + "=".repeat(60));
    console.log("🎯 Brand-assets verification completed!");
    
    if (missingImages.length === 0) {
      console.log("\n✅ All expected images found in brand-assets bucket!");
      console.log("   The issue might be with URL formatting or permissions");
    } else {
      console.log(`\n❌ Found ${missingImages.length} missing images`);
      console.log("   This explains why the frontend shows placeholders");
      
      console.log("\n💡 Possible causes:");
      console.log("   1. Image files were moved or deleted from brand-assets");
      console.log("   2. Filenames changed during the restoration process");
      console.log("   3. Images are in a different bucket than expected");
      console.log("   4. File permissions or access issues");
    }
    
    console.log("\n🚀 Next steps:");
    if (missingImages.length > 0) {
      console.log("   1. Check if images exist in other buckets");
      console.log("   2. Verify the actual filenames in brand-assets");
      console.log("   3. Update database with correct filenames");
      console.log("   4. Or restore images from backup");
    } else {
      console.log("   1. Check Supabase storage permissions");
      console.log("   2. Verify URL formatting in database");
      console.log("   3. Test image access from different locations");
    }
    
  } catch (error) {
    console.error("❌ Error in verifyBrandAssetsImages:", error);
  }
}

// Run the verification
verifyBrandAssetsImages().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
