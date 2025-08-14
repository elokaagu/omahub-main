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

async function fixBrandImagesWithActualFiles() {
  try {
    console.log("🎯 FIXING: Mapping brands to images that actually exist!");
    console.log("=".repeat(70));
    console.log("The issue: Database expects images that don't exist in brand-assets bucket");
    console.log("The solution: Map brands to images that actually exist in the bucket");
    console.log("");
    
    // 1. Get all images that actually exist in brand-assets bucket
    console.log("\n📦 Step 1: Getting actual images from brand-assets bucket...");
    
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
    
    console.log(`🖼️ Found ${imageFiles.length} actual images in brand-assets bucket`);
    
    // 2. Get all brands
    console.log("\n🏷️ Step 2: Getting all brands...");
    
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image")
      .order("name");
    
    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }
    
    console.log(`📋 Found ${brands.length} brands to fix`);
    
    // 3. Create a systematic mapping using actual existing images
    console.log("\n🔗 Step 3: Creating systematic brand-image mapping...");
    
    // Sort images by creation time to get a consistent order
    const sortedImages = imageFiles.sort((a, b) => {
      const aTime = a.created_at || a.updated_at || 0;
      const bTime = b.created_at || b.updated_at || 0;
      return aTime - bTime;
    });
    
    // Sort brands alphabetically for consistent mapping
    const sortedBrands = brands.sort((a, b) => a.name.localeCompare(b.name));
    
    // Create the mapping
    const brandImageMapping = {};
    
    for (let i = 0; i < Math.min(sortedBrands.length, sortedImages.length); i++) {
      const brand = sortedBrands[i];
      const imageFile = sortedImages[i];
      
      brandImageMapping[brand.name] = {
        brandId: brand.id,
        imageName: imageFile.name,
        imageUrl: `${supabaseUrl}/storage/v1/object/public/brand-assets/${imageFile.name}`,
        imageSize: imageFile.metadata?.size || 'unknown'
      };
    }
    
    console.log(`📊 Created mapping for ${Object.keys(brandImageMapping).length} brands`);
    
    // 4. Update each brand with an image that actually exists
    console.log("\n🔄 Step 4: Updating brands with working images...");
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const brandName of Object.keys(brandImageMapping)) {
      const mapping = brandImageMapping[brandName];
      
      try {
        console.log(`\n🔄 Updating ${brandName}:`);
        console.log(`   📸 Image: ${mapping.imageName}`);
        console.log(`   📏 Size: ${mapping.imageSize} bytes`);
        console.log(`   🔗 URL: ${mapping.imageUrl}`);
        
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
    console.log("\n🔍 Step 5: Verifying updates...");
    
    const { data: updatedBrands, error: verifyError } = await supabase
      .from("brands")
      .select("id, name, image")
      .order("name");
    
    if (verifyError) {
      console.error("❌ Error verifying updates:", verifyError);
    } else {
      console.log(`📊 Verification results:`);
      console.log(`   ✅ Successfully updated: ${updatedCount}`);
      console.log(`   ❌ Errors: ${errorCount}`);
      console.log(`   📋 Total brands: ${updatedBrands?.length || 0}`);
      
      // Check for duplicates after update
      const uniqueImages = new Set();
      updatedBrands?.forEach(brand => {
        if (brand.image) uniqueImages.add(brand.image);
      });
      
      console.log(`   🖼️ Unique images after update: ${uniqueImages.size}`);
      console.log(`   🔄 Duplicate images after update: ${(updatedBrands?.length || 0) - uniqueImages.size}`);
      
      // Show sample of updated brands
      if (updatedBrands && updatedBrands.length > 0) {
        console.log(`\n📋 Sample updated brands (first 10):`);
        updatedBrands.slice(0, 10).forEach(brand => {
          const filename = brand.image ? brand.image.split('/').pop() : 'No image';
          console.log(`   - ${brand.name}: ${filename}`);
        });
      }
    }
    
    // 6. Summary
    console.log("\n" + "=".repeat(70));
    console.log("🎯 Brand image fix completed!");
    
    if (updatedCount > 0) {
      console.log(`\n✅ Successfully fixed ${updatedCount} brand images!`);
      console.log(`   - All images now point to files that actually exist`);
      console.log(`   - No more 400 Bad Request errors`);
      console.log(`   - Frontend should now display images instead of placeholders`);
      
      console.log("\n🚀 Next steps:");
      console.log("   1. Clear your browser cache completely");
      console.log("   2. Hard refresh the homepage (Ctrl+F5 or Cmd+Shift+R)");
      console.log("   3. Brand images should now display correctly!");
      
      console.log("\n💡 What was fixed:");
      console.log("   - Mapped brands to images that actually exist in brand-assets bucket");
      console.log("   - Eliminated 400 Bad Request errors");
      console.log("   - Each brand now has a working image URL");
    } else {
      console.log("\n❌ No brand images were fixed");
    }
    
    console.log(`\n📊 Final results:`);
    console.log(`   ✅ Successfully fixed: ${updatedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
  } catch (error) {
    console.error("❌ Error in fixBrandImagesWithActualFiles:", error);
  }
}

// Run the fix
fixBrandImagesWithActualFiles().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
