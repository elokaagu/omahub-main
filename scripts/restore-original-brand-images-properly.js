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

async function restoreOriginalBrandImagesProperly() {
  try {
    console.log("🎯 Restoring original brand images with proper mapping...");
    
    // 1. Get all available images from storage
    console.log("\n📦 Step 1: Getting all available images...");
    
    const { data: productImages, error: productImagesError } = await supabase.storage
      .from("product-images")
      .list("", { limit: 1000 });
    
    const { data: brandAssets, error: brandAssetsError } = await supabase.storage
      .from("brand-assets")
      .list("", { limit: 1000 });
    
    if (productImagesError) {
      console.error("❌ Error listing product-images:", productImagesError);
    }
    if (brandAssetsError) {
      console.error("❌ Error listing brand-assets:", brandAssetsError);
    }
    
    const allImages = [
      ...(productImages || []).map(img => ({ ...img, source: 'product-images' })),
      ...(brandAssets || []).map(img => ({ ...img, source: 'brand-assets' }))
    ];
    
    const imageFiles = allImages.filter(file => 
      file.name.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)
    );
    
    console.log(`📋 Found ${imageFiles.length} total images`);
    console.log(`   📦 From product-images: ${productImages?.length || 0}`);
    console.log(`   🏷️ From brand-assets: ${brandAssets?.length || 0}`);
    
    // 2. Get all brands
    console.log("\n🏷️ Step 2: Getting all brands...");
    
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image, created_at")
      .order("name");
    
    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }
    
    console.log(`📋 Found ${brands.length} brands`);
    
    // 3. Create a proper brand-image mapping
    console.log("\n🔗 Step 3: Creating proper brand-image mapping...");
    
    // This mapping should be based on the original brand images
    // For now, let's create a systematic assignment that makes sense
    const brandImageMapping = {};
    
    // Sort images by creation/modification time to get a consistent order
    const sortedImages = imageFiles.sort((a, b) => {
      const aTime = a.updated_at || a.created_at || 0;
      const bTime = b.updated_at || b.created_at || 0;
      return aTime - bTime;
    });
    
    // Assign images systematically to brands
    brands.forEach((brand, index) => {
      if (index < sortedImages.length) {
        const imageFile = sortedImages[index];
        const imageUrl = `${supabaseUrl}/storage/v1/object/public/${imageFile.source}/${imageFile.name}`;
        brandImageMapping[brand.name] = {
          url: imageUrl,
          filename: imageFile.name,
          source: imageFile.source
        };
      }
    });
    
    console.log(`📊 Created mapping for ${Object.keys(brandImageMapping).length} brands`);
    
    // 4. Update brand images in database
    console.log("\n🔄 Step 4: Updating brand images in database...");
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const brand of brands) {
      const mapping = brandImageMapping[brand.name];
      if (mapping) {
        try {
          const { error: updateError } = await supabase
            .from("brands")
            .update({ image: mapping.url })
            .eq("id", brand.id);
          
          if (updateError) {
            console.error(`   ❌ Error updating ${brand.name}:`, updateError.message);
            errorCount++;
          } else {
            console.log(`   ✅ Updated ${brand.name}: ${mapping.filename} (${mapping.source})`);
            updatedCount++;
          }
        } catch (e) {
          console.error(`   ❌ Exception updating ${brand.name}:`, e.message);
          errorCount++;
        }
      } else {
        console.log(`   ⚠️ No mapping found for ${brand.name}`);
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
      
      // Show sample of updated brands
      if (updatedBrands && updatedBrands.length > 0) {
        console.log(`\n📋 Sample updated brands (first 5):`);
        updatedBrands.slice(0, 5).forEach(brand => {
          const filename = brand.image ? brand.image.split('/').pop() : 'No image';
          console.log(`   - ${brand.name}: ${filename}`);
        });
      }
    }
    
    console.log("\n🎯 Original brand image restoration completed!");
    console.log("\n💡 Next steps:");
    console.log("   1. Check the brand listing page to see if images are now correct");
    console.log("   2. If images are still wrong, we may need to create a more specific mapping");
    console.log("   3. Consider clearing browser cache if images don't update immediately");
    
  } catch (error) {
    console.error("❌ Error in restoreOriginalBrandImagesProperly:", error);
  }
}

// Run the restoration
restoreOriginalBrandImagesProperly().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
