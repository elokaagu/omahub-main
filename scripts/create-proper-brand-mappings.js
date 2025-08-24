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

async function createProperBrandMappings() {
  try {
    console.log("🔍 Creating proper brand-image mappings...");
    console.log("======================================================================");

    // Step 1: Get all available images in the brand-assets bucket
    console.log("\n📋 Step 1: Analyzing all available images...");
    const { data: allImages, error: imagesError } = await supabase.storage
      .from("brand-assets")
      .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });

    if (imagesError) {
      console.error("❌ Error listing images:", imagesError);
      return;
    }

    // Filter to actual image files
    const imageFiles = allImages.filter(file => 
      file.name && 
      !file.name.includes("avatars") && 
      !file.name.includes("brands") && 
      !file.name.includes("collections") && 
      !file.name.includes("portfolio") &&
      (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.png') || file.name.endsWith('.webp'))
    );

    console.log(`✅ Found ${imageFiles.length} image files to analyze`);

    // Step 2: Categorize images by type
    console.log("\n🔍 Step 2: Categorizing images...");
    
    const genericModelImages = [];
    const potentialBrandImages = [];
    const productImages = [];

    imageFiles.forEach(file => {
      const filename = file.name.toLowerCase();
      
      // Generic model images (people in fashion)
      if (filename.includes("model") || 
          filename.includes("person") || 
          filename.includes("woman") || 
          filename.includes("man") ||
          filename.includes("portrait")) {
        genericModelImages.push(file.name);
      }
      // Potential brand-specific images
      else if (filename.includes("brand") || 
               filename.includes("logo") || 
               filename.includes("hero") ||
               filename.includes("collection") ||
               filename.includes("boutique")) {
        potentialBrandImages.push(file.name);
      }
      // Product images
      else {
        productImages.push(file.name);
      }
    });

    console.log(`📊 Image categorization:`);
    console.log(`   🚫 Generic models: ${genericModelImages.length}`);
    console.log(`   🏷️  Potential brand images: ${potentialBrandImages.length}`);
    console.log(`   📦 Product images: ${productImages.length}`);

    // Step 3: Show sample of each category
    if (genericModelImages.length > 0) {
      console.log(`\n📋 Sample generic model images (first 5):`);
      genericModelImages.slice(0, 5).forEach(img => console.log(`   - ${img}`));
    }

    if (potentialBrandImages.length > 0) {
      console.log(`\n📋 Sample potential brand images (first 10):`);
      potentialBrandImages.slice(0, 10).forEach(img => console.log(`   - ${img}`));
    }

    if (productImages.length > 0) {
      console.log(`\n📋 Sample product images (first 10):`);
      productImages.slice(0, 10).forEach(img => console.log(`   - ${img}`));
    }

    // Step 4: Get current brand status
    console.log("\n🔍 Step 4: Current brand status...");
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image, category, location")
      .order("name");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    console.log(`✅ Found ${brands.length} brands`);

    // Step 5: Identify brands that need proper images
    const brandsNeedingImages = brands.filter(brand => 
      brand.image && brand.image.includes("placeholder")
    );

    console.log(`\n⚠️  Brands needing proper images: ${brandsNeedingImages.length}`);
    brandsNeedingImages.forEach(brand => {
      console.log(`   - ${brand.name} (${brand.category}, ${brand.location})`);
    });

    // Step 6: Create intelligent image assignments
    console.log("\n🔍 Step 6: Creating intelligent image assignments...");
    
    // For now, let's assign some of the better-looking product images to these brands
    // This is a temporary solution - ideally these should be actual brand-specific images
    
    const imageAssignments = {};
    
    if (brandsNeedingImages.length > 0 && productImages.length > 0) {
      console.log(`\n🔧 Assigning product images to brands temporarily...`);
      
      brandsNeedingImages.forEach((brand, index) => {
        if (productImages[index]) {
          const imageUrl = `https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/${productImages[index]}`;
          imageAssignments[brand.name] = imageUrl;
          console.log(`   ${brand.name} → ${productImages[index]}`);
        }
      });
    }

    // Step 7: Apply the assignments
    if (Object.keys(imageAssignments).length > 0) {
      console.log(`\n🔧 Step 7: Applying image assignments...`);
      
      for (const [brandName, imageUrl] of Object.entries(imageAssignments)) {
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

    console.log("\n======================================================================");
    console.log("🎯 Brand image mapping analysis completed!");
    console.log("📝 Summary:");
    console.log(`   🚫 Generic model images found: ${genericModelImages.length}`);
    console.log(`   🏷️  Potential brand images: ${potentialBrandImages.length}`);
    console.log(`   📦 Product images available: ${productImages.length}`);
    console.log(`   🔧 Brands updated: ${Object.keys(imageAssignments).length}`);
    console.log("\n📝 Next steps:");
    console.log("   1. Review the temporary assignments");
    console.log("   2. Upload actual brand-specific images");
    console.log("   3. Replace temporary assignments with proper brand images");
    console.log("🏁 Script completed");

  } catch (error) {
    console.error("❌ Script error:", error);
  }
}

// Run the script
createProperBrandMappings();
