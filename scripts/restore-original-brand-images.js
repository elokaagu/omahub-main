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

async function restoreOriginalBrandImages() {
  try {
    console.log("🎯 Restoring original brand images from product-images bucket...");
    
    // 1. Get all brands
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image, created_at")
      .order("created_at"); // Order by creation date to match with image uploads
    
    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }
    
    console.log(`📋 Found ${brands.length} brands to restore`);
    
    // 2. Get all images from product-images bucket
    const { data: productImages, error: imagesError } = await supabase.storage
      .from("product-images")
      .list("", { limit: 1000 });
    
    if (imagesError) {
      console.error("❌ Error fetching product images:", imagesError);
      return;
    }
    
    console.log(`🖼️ Found ${productImages.length} images in product-images bucket`);
    
    // Filter for actual image files (not folders)
    const imageFiles = productImages.filter(file => 
      file.name.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i) &&
      !file.name.includes('brands') // Exclude the brands folder
    );
    
    console.log(`📸 Found ${imageFiles.length} actual image files`);
    
    // 3. Match brands with images based on creation order
    // The assumption is that brands and images were uploaded in the same order
    for (let i = 0; i < brands.length && i < imageFiles.length; i++) {
      const brand = brands[i];
      const imageFile = imageFiles[i];
      
      // Create the full URL for the image
      const imageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${imageFile.name}`;
      
      console.log(`\n🔗 Restoring ${brand.name}:`);
      console.log(`   Image: ${imageFile.name}`);
      console.log(`   URL: ${imageUrl}`);
      console.log(`   Size: ${imageFile.metadata?.size || 'unknown'} bytes`);
      
      // Update the brand's image
      const { error: updateError } = await supabase
        .from("brands")
        .update({ image: imageUrl })
        .eq("id", brand.id);
      
      if (updateError) {
        console.error(`   ❌ Failed to update ${brand.name}:`, updateError);
      } else {
        console.log(`   ✅ Successfully restored image for ${brand.name}`);
      }
    }
    
    // 4. For any remaining brands, use the remaining images
    if (brands.length > imageFiles.length) {
      console.log(`\n⚠️ ${brands.length - imageFiles.length} brands don't have matching images`);
      console.log("   These brands will keep their current images (placeholders or collection images)");
    }
    
    // 5. Verify the restoration
    console.log("\n🔍 Verifying restoration...");
    const { data: updatedBrands, error: verifyError } = await supabase
      .from("brands")
      .select("name, image")
      .order("created_at");
    
    if (!verifyError && updatedBrands) {
      const brandsWithRealImages = updatedBrands.filter(b => 
        b.image && !b.image.includes("placeholder")
      );
      
      console.log(`✅ ${brandsWithRealImages.length} brands now have real images`);
      console.log(`📝 ${updatedBrands.length - brandsWithRealImages.length} brands still have placeholders`);
      
      // Show a few examples
      console.log("\n📸 Sample restored images:");
      updatedBrands.slice(0, 5).forEach(brand => {
        const hasRealImage = brand.image && !brand.image.includes("placeholder");
        console.log(`   ${brand.name}: ${hasRealImage ? "✅ Real image" : "📝 Placeholder"}`);
      });
    }
    
    console.log("\n🎉 Original brand image restoration completed!");
    
  } catch (error) {
    console.error("❌ Error in restoreOriginalBrandImages:", error);
  }
}

// Run the restoration
restoreOriginalBrandImages().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
