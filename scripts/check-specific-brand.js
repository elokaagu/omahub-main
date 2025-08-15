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

async function checkSpecificBrand() {
  try {
    console.log("🔍 CHECKING: Specific brand '54 Stitches' image...");
    console.log("=".repeat(70));
    console.log("This will check and fix the incorrect brand image");
    console.log("");
    
    // 1. Get the specific brand
    console.log("\n📦 Step 1: Getting brand '54 Stitches'...");
    
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image, created_at")
      .eq("name", "54 Stitches")
      .single();
    
    if (brandsError) {
      console.error("❌ Error fetching brand:", brandsError);
      return;
    }
    
    if (!brands) {
      console.error("❌ Brand '54 Stitches' not found");
      return;
    }
    
    console.log(`📋 Found brand: ${brands.name}`);
    console.log(`   📅 Created: ${new Date(brands.created_at).toLocaleString()}`);
    console.log(`   🖼️ Current image: ${brands.image ? brands.image.split('/').pop() : 'No image'}`);
    
    // 2. Get all available brand images
    console.log("\n🖼️ Step 2: Getting available brand images...");
    
    const { data: brandImages, error: brandImagesError } = await supabase.storage
      .from("brand-assets")
      .list("", { limit: 1000 });
    
    if (brandImagesError) {
      console.error("❌ Error listing brand-assets:", brandImagesError);
      return;
    }
    
    const imageFiles = brandImages.filter(file => 
      file.name.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)
    );
    
    console.log(`🖼️ Found ${imageFiles.length} available brand images`);
    
    // 3. Find the best image match for this brand
    console.log("\n🔍 Step 3: Finding best image match...");
    
    const brandCreatedAt = new Date(brands.created_at).getTime();
    
    // Sort images by creation time
    const sortedImages = imageFiles.sort((a, b) => {
      const aTime = new Date(a.created_at || a.updated_at || 0).getTime();
      const bTime = new Date(b.created_at || b.updated_at || 0).getTime();
      return aTime - bTime;
    });
    
    // Find the closest image by creation time
    let bestImage = null;
    let smallestTimeDiff = Infinity;
    
    sortedImages.forEach(image => {
      const imageCreatedAt = new Date(image.created_at || image.updated_at || 0).getTime();
      const timeDiff = Math.abs(brandCreatedAt - imageCreatedAt);
      
      if (timeDiff < smallestTimeDiff) {
        smallestTimeDiff = timeDiff;
        bestImage = image;
      }
    });
    
    if (bestImage) {
      const timeDiffHours = Math.round(smallestTimeDiff / 1000 / 1000 / 60);
      const timeDiffMinutes = Math.round(smallestTimeDiff / 1000 / 60);
      
      console.log(`\n🎯 Best image match for ${brands.name}:`);
      console.log(`   📅 Brand created: ${new Date(brands.created_at).toLocaleString()}`);
      console.log(`   🖼️ Image uploaded: ${new Date(bestImage.created_at || bestImage.updated_at || 0).toLocaleString()}`);
      console.log(`   ⏱️ Time difference: ${timeDiffHours} hours (${timeDiffMinutes} minutes)`);
      console.log(`   📸 Image: ${bestImage.name}`);
      console.log(`   🔄 Current image: ${brands.image ? brands.image.split('/').pop() : 'No image'}`);
      console.log(`   📏 Size: ${bestImage.metadata?.size || 'unknown'} bytes`);
      
      // Check if this image is already used by another brand
      const { data: existingUsage, error: usageError } = await supabase
        .from("brands")
        .select("id, name")
        .eq("image", `${supabaseUrl}/storage/v1/object/public/brand-assets/${bestImage.name}`);
      
      if (usageError) {
        console.error("❌ Error checking image usage:", usageError);
      } else if (existingUsage && existingUsage.length > 0) {
        console.log(`\n⚠️ This image is already used by:`);
        existingUsage.forEach(brand => {
          if (brand.id !== brands.id) {
            console.log(`   - ${brand.name}`);
          }
        });
      } else {
        console.log(`\n✅ This image is available for use`);
      }
      
      // 4. Update the brand with the correct image
      console.log("\n🔄 Step 4: Updating brand with correct image...");
      
      const newImageUrl = `${supabaseUrl}/storage/v1/object/public/brand-assets/${bestImage.name}`;
      
      try {
        console.log(`\n🔄 Updating ${brands.name}:`);
        console.log(`   📸 New image: ${bestImage.name}`);
        console.log(`   🔄 Old image: ${brands.image ? brands.image.split('/').pop() : 'No image'}`);
        console.log(`   ⏱️ Time diff: ${timeDiffHours} hours`);
        console.log(`   📏 Size: ${bestImage.metadata?.size || 'unknown'} bytes`);
        
        const { error: updateError } = await supabase
          .from("brands")
          .update({ image: newImageUrl })
          .eq("id", brands.id);
        
        if (updateError) {
          console.error(`   ❌ Error updating ${brands.name}:`, updateError.message);
        } else {
          console.log(`   ✅ Successfully updated ${brands.name}`);
          
          // 5. Verification
          console.log("\n🔍 Step 5: Verifying update...");
          
          const { data: updatedBrand, error: verifyError } = await supabase
            .from("brands")
            .select("id, name, image, created_at")
            .eq("id", brands.id)
            .single();
          
          if (verifyError) {
            console.error("❌ Error verifying update:", verifyError);
          } else {
            console.log(`📊 Verification results:`);
            console.log(`   ✅ Brand: ${updatedBrand.name}`);
            console.log(`   🖼️ New image: ${updatedBrand.image ? updatedBrand.image.split('/').pop() : 'No image'}`);
            console.log(`   📅 Created: ${new Date(updatedBrand.created_at).toLocaleString()}`);
          }
        }
        
      } catch (e) {
        console.error(`   ❌ Exception updating ${brands.name}:`, e.message);
      }
      
    } else {
      console.log("\n❌ No suitable image found");
    }
    
    // 6. Summary
    console.log("\n" + "=".repeat(70));
    console.log("🎯 Specific brand image check completed!");
    
    if (bestImage) {
      console.log(`\n✅ Found best image match for ${brands.name}!`);
      console.log(`   - Image: ${bestImage.name}`);
      console.log(`   - Time difference: ${Math.round(smallestTimeDiff / 1000 / 1000 / 60)} hours`);
      console.log(`   - Brand should now display the correct image`);
      
      console.log("\n🚀 Next steps:");
      console.log("   1. Clear your browser cache completely");
      console.log("   2. Hard refresh the brand edit page (Ctrl+F5 or Cmd+Shift+R)");
      console.log("   3. The brand image should now be correct!");
    } else {
      console.log("\n❌ No suitable image found for this brand");
    }
    
  } catch (error) {
    console.error("❌ Error in checkSpecificBrand:", error);
  }
}

// Run the specific brand check
checkSpecificBrand().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
