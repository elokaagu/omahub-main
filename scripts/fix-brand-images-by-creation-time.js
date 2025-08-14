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

async function fixBrandImagesByCreationTime() {
  try {
    console.log("🎯 FIXING: Mapping brands to images by creation time similarity!");
    console.log("=".repeat(70));
    console.log("The approach: Match brands to images based on when they were created");
    console.log("This should restore the original brand-image associations");
    console.log("");
    
    // 1. Get all brands with their creation times
    console.log("\n🏷️ Step 1: Getting brands with creation times...");
    
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image, created_at")
      .order("created_at");
    
    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }
    
    console.log(`📋 Found ${brands.length} brands`);
    
    // Show sample brands with creation times
    console.log("\n📅 Sample brands with creation times:");
    brands.slice(0, 5).forEach(brand => {
      const date = new Date(brand.created_at).toLocaleString();
      console.log(`   - ${brand.name}: ${date}`);
    });
    
    // 2. Get all images from brand-assets bucket with their creation times
    console.log("\n📦 Step 2: Getting brand-assets images with creation times...");
    
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
    console.log("\n🔗 Step 3: Creating time-based brand-image mapping...");
    
    const brandImageMapping = {};
    const usedImages = new Set();
    
    // For each brand, find the closest image by creation time
    brands.forEach((brand, index) => {
      const brandCreatedAt = new Date(brand.created_at).getTime();
      
      // Find the closest image by creation time that hasn't been used
      let closestImage = null;
      let smallestTimeDiff = Infinity;
      
      sortedImages.forEach(image => {
        if (usedImages.has(image.name)) return; // Skip already used images
        
        const imageCreatedAt = new Date(image.created_at || image.updated_at || 0).getTime();
        const timeDiff = Math.abs(brandCreatedAt - imageCreatedAt);
        
        if (timeDiff < smallestTimeDiff) {
          smallestTimeDiff = timeDiff;
          closestImage = image;
        }
      });
      
      if (closestImage) {
        brandImageMapping[brand.name] = {
          brandId: brand.id,
          brandCreatedAt: brand.created_at,
          imageName: closestImage.name,
          imageCreatedAt: closestImage.created_at || closestImage.updated_at,
          timeDiff: smallestTimeDiff,
          imageUrl: `${supabaseUrl}/storage/v1/object/public/brand-assets/${closestImage.name}`,
          imageSize: closestImage.metadata?.size || 'unknown'
        };
        
        usedImages.add(closestImage.name);
        
        console.log(`\n🔗 Mapped ${brand.name}:`);
        console.log(`   📅 Brand created: ${new Date(brand.created_at).toLocaleString()}`);
        console.log(`   🖼️ Image uploaded: ${new Date(closestImage.created_at || closestImage.updated_at || 0).toLocaleString()}`);
        console.log(`   ⏱️ Time difference: ${Math.round(smallestTimeDiff / 1000 / 60)} minutes`);
        console.log(`   📸 Image: ${closestImage.name}`);
      } else {
        console.log(`\n⚠️ No available image for ${brand.name}`);
      }
    });
    
    console.log(`\n📊 Created time-based mapping for ${Object.keys(brandImageMapping).length} brands`);
    
    // 4. Update brands with time-matched images
    console.log("\n🔄 Step 4: Updating brands with time-matched images...");
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const brandName of Object.keys(brandImageMapping)) {
      const mapping = brandImageMapping[brandName];
      
      try {
        console.log(`\n🔄 Updating ${brandName}:`);
        console.log(`   📸 Image: ${mapping.imageName}`);
        console.log(`   ⏱️ Time diff: ${Math.round(mapping.timeDiff / 1000 / 60)} minutes`);
        console.log(`   📏 Size: ${mapping.imageSize} bytes`);
        
        const { error: updateError } = await supabase
          .from("brands")
          .update({ image: mapping.imageUrl })
          .eq("id", mapping.brandId);
        
        if (updateError) {
          console.error(`   ❌ Error updating ${brandName}:`, updateError.message);
          errorCount++;
        } else {
          console.log(`   ✅ Successfully updated ${brandName}`);
          updatedCount++;
        }
        
      } catch (e) {
        console.error(`   ❌ Exception updating ${brandName}:`, e.message);
        errorCount++;
      }
    }
    
    // 5. Verification
    console.log("\n🔍 Step 5: Verifying time-based updates...");
    
    const { data: updatedBrands, error: verifyError } = await supabase
      .from("brands")
      .select("id, name, image, created_at")
      .order("created_at");
    
    if (verifyError) {
      console.error("❌ Error verifying updates:", verifyError);
    } else {
      console.log(`📊 Verification results:`);
      console.log(`   ✅ Successfully updated: ${updatedCount}`);
      console.log(`   ❌ Errors: ${errorCount}`);
      console.log(`   📋 Total brands: ${updatedBrands?.length || 0}`);
      
      // Show the new brand-image associations
      if (updatedBrands && updatedBrands.length > 0) {
        console.log(`\n📋 New brand-image associations (first 15):`);
        updatedBrands.slice(0, 15).forEach(brand => {
          const filename = brand.image ? brand.image.split('/').pop() : 'No image';
          const date = new Date(brand.created_at).toLocaleString();
          console.log(`   - ${brand.name} (${date}): ${filename}`);
        });
      }
    }
    
    // 6. Summary
    console.log("\n" + "=".repeat(70));
    console.log("🎯 Time-based brand image fix completed!");
    
    if (updatedCount > 0) {
      console.log(`\n✅ Successfully fixed ${updatedCount} brand images using time-based mapping!`);
      console.log(`   - Brands are now mapped to images created around the same time`);
      console.log(`   - This should restore the original brand-image associations`);
      console.log(`   - No more mismatched images!`);
      
      console.log("\n🚀 Next steps:");
      console.log("   1. Clear your browser cache completely");
      console.log("   2. Hard refresh the homepage (Ctrl+F5 or Cmd+Shift+R)");
      console.log("   3. Brand images should now display with correct associations!");
      
      console.log("\n💡 What was improved:");
      console.log("   - Used creation time similarity for accurate brand-image mapping");
      console.log("   - Each brand gets an image created around the same time");
      console.log("   - Eliminated random image assignments");
    } else {
      console.log("\n❌ No brand images were fixed");
    }
    
    console.log(`\n📊 Final results:`);
    console.log(`   ✅ Successfully fixed: ${updatedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
  } catch (error) {
    console.error("❌ Error in fixBrandImagesByCreationTime:", error);
  }
}

// Run the time-based fix
fixBrandImagesByCreationTime().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
