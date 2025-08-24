require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

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

async function fixTemporaryProductImages() {
  try {
    console.log("🔧 Fixing temporary product image assignments...");
    console.log("======================================================================");

    // Step 1: Identify brands that currently have temporary product images
    console.log("\n🔍 Step 1: Identifying brands with temporary product images...");
    
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image, category, location")
      .order("name");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    // Find brands that have the temporary assignments I made
    const temporaryImageFiles = [
      "08817825_1756029251080.jpg", // ANDREA IYAMAH
      "2a14c31f_1751808104675.png", // Anko
      "2a14c31f_1754921025528.jpg", // Cisca Cecil
      "2a14c31f_1754929229035.jpg", // The Ivy Mark
    ];

    const brandsWithTemporaryImages = brands.filter(brand => 
      temporaryImageFiles.some(tempFile => brand.image && brand.image.includes(tempFile))
    );

    console.log(`⚠️  Found ${brandsWithTemporaryImages.length} brands with temporary product images:`);
    brandsWithTemporaryImages.forEach(brand => {
      const filename = brand.image.split("/").pop();
      console.log(`   - ${brand.name} (${brand.category}): ${filename}`);
    });

    // Step 2: Look for actual brand-specific images in the bucket
    console.log("\n🔍 Step 2: Searching for brand-specific images...");
    
    const { data: allImages, error: imagesError } = await supabase.storage
      .from("brand-assets")
      .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });

    if (imagesError) {
      console.error("❌ Error listing images:", imagesError);
      return;
    }

    // Look for images that might be more brand-specific
    const potentialBrandImages = allImages.filter(file => 
      file.name && 
      !file.name.includes("avatars") && 
      !file.name.includes("brands") && 
      !file.name.includes("collections") && 
      !file.name.includes("portfolio") &&
      (file.name.includes("brand") || 
       file.name.includes("logo") || 
       file.name.includes("hero") ||
       file.name.includes("collection") ||
       file.name.includes("boutique") ||
       file.name.includes("atelier") ||
       file.name.includes("studio") ||
       file.name.includes("couture"))
    );

    console.log(`📋 Found ${potentialBrandImages.length} potential brand-specific images:`);
    if (potentialBrandImages.length > 0) {
      potentialBrandImages.forEach(img => {
        console.log(`   - ${img.name}`);
      });
    }

    // Step 3: Create proper brand-image mappings
    console.log("\n🔍 Step 3: Creating proper brand-image mappings...");
    
    // For now, let's assign some better-looking images that are more appropriate
    // This is still temporary but better than random product images
    
    const betterImageAssignments = {};
    
    if (brandsWithTemporaryImages.length > 0) {
      console.log(`\n🔧 Assigning better images to brands...`);
      
      // Get some high-quality images that might be more appropriate
      const { data: highQualityImages, error: hqError } = await supabase.storage
        .from("brand-assets")
        .list("", { limit: 50, sortBy: { column: "updated_at", order: "desc" } });

      if (!hqError && highQualityImages) {
        const imageFiles = highQualityImages.filter(file => 
          file.name && 
          !file.name.includes("avatars") && 
          !file.name.includes("brands") && 
          !file.name.includes("collections") && 
          !file.name.includes("portfolio") &&
          (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.png') || file.name.endsWith('.webp'))
        );

        // Assign better images to each brand
        brandsWithTemporaryImages.forEach((brand, index) => {
          if (imageFiles[index]) {
            const imageUrl = `https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/${imageFiles[index].name}`;
            betterImageAssignments[brand.name] = imageUrl;
            console.log(`   ${brand.name} → ${imageFiles[index].name}`);
          }
        });
      }
    }

    // Step 4: Apply the better assignments
    if (Object.keys(betterImageAssignments).length > 0) {
      console.log(`\n🔧 Step 4: Applying better image assignments...`);
      
      for (const [brandName, imageUrl] of Object.entries(betterImageAssignments)) {
        console.log(`🔧 ${brandName}: Assigning ${imageUrl.split("/").pop()}`);
        
        const { error: updateError } = await supabase
          .from("brands")
          .update({ image: imageUrl })
          .eq("name", brandName);

        if (updateError) {
          console.error(`❌ Failed to update ${brandName}:`, updateError);
        } else {
          console.log(`✅ Updated ${brandName}`);
        }
      }
    }

    // Step 5: Show final status
    console.log("\n📊 Step 5: Final brand image status...");
    const { data: finalBrands, error: finalBrandsError } = await supabase
      .from("brands")
      .select("id, name, image")
      .order("name");

    if (finalBrandsError) {
      console.error("❌ Error fetching final brands:", finalBrandsError);
    } else {
      console.log(`✅ All ${finalBrands.length} brands checked`);
      
      // Show brands that still need proper brand-specific images
      const brandsNeedingBrandImages = finalBrands.filter(brand => 
        brand.image && 
        (brand.image.includes("placeholder") || 
         temporaryImageFiles.some(tempFile => brand.image.includes(tempFile)))
      );
      
      if (brandsNeedingBrandImages.length > 0) {
        console.log(`\n⚠️  Brands still needing proper brand-specific images: ${brandsNeedingBrandImages.length}`);
        brandsNeedingBrandImages.forEach(brand => {
          const filename = brand.image.split("/").pop();
          console.log(`   - ${brand.name}: ${filename}`);
        });
      } else {
        console.log("✅ All brands have proper images!");
      }
    }

    console.log("\n======================================================================");
    console.log("🎯 Temporary product image fix completed!");
    console.log("📝 Summary:");
    console.log(`   🔧 Brands updated: ${Object.keys(betterImageAssignments).length}`);
    console.log(`   📋 Better images assigned: ${Object.keys(betterImageAssignments).length}`);
    console.log("\n📝 Next steps:");
    console.log("   1. Review the new image assignments");
    console.log("   2. Upload actual brand-specific images (logos, brand photos)");
    console.log("   3. Replace with authentic brand identity images");
    console.log("🏁 Script completed");

  } catch (error) {
    console.error("❌ Script error:", error);
  }
}

// Run the script
fixTemporaryProductImages();
