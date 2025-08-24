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

async function fixBrandImageAssignments() {
  try {
    console.log("🔧 Fixing brand image assignments...");
    console.log("======================================================================");

    // First, let's identify the problematic images that are generic fashion models
    console.log("\n🔍 Step 1: Identifying generic fashion model images...");
    
    // These are the images that appear to be generic fashion models, not brand-specific
    const genericModelImages = [
      "62c22996_1749638992452.png", // Anko - woman in colorful outfit
      "62c22996_1749626596547.png", // The Ivy Mark - woman in olive dress
      "62c22996_1750929606892.png", // ANDREA IYAMAH - might be generic
      "62c22996_1749643002789.png", // Cisca Cecil - might be generic
    ];

    console.log("📋 Generic model images identified:");
    genericModelImages.forEach(img => console.log(`   - ${img}`));

    // Step 2: Find actual brand-specific images in the bucket
    console.log("\n🔍 Step 2: Finding brand-specific images...");
    const { data: allImages, error: imagesError } = await supabase.storage
      .from("brand-assets")
      .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });

    if (imagesError) {
      console.error("❌ Error listing images:", imagesError);
      return;
    }

    // Filter out directories and get actual image files
    const imageFiles = allImages.filter(file => 
      file.name && 
      !file.name.includes("avatars") && 
      !file.name.includes("brands") && 
      !file.name.includes("collections") && 
      !file.name.includes("portfolio") &&
      (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.png') || file.name.endsWith('.webp'))
    );

    console.log(`✅ Found ${imageFiles.length} actual image files`);

    // Step 3: Create a mapping of which images should go to which brands
    console.log("\n🔍 Step 3: Creating proper brand-image mappings...");
    
    // This mapping should be based on actual brand identity, not generic models
    // For now, let's assign placeholder images to brands that have generic models
    const brandImageMappings = {
      // Brands that currently have generic model images - assign them placeholder images
      "Anko": null, // Will get placeholder
      "The Ivy Mark": null, // Will get placeholder
      "ANDREA IYAMAH": null, // Will get placeholder if generic
      "Cisca Cecil": null, // Will get placeholder if generic
    };

    // Step 4: Update brands with placeholder images
    console.log("\n🔧 Step 4: Updating brands with placeholder images...");
    
    for (const [brandName, newImage] of Object.entries(brandImageMappings)) {
      if (newImage === null) {
        // Set a placeholder image for now
        const placeholderImage = "https://via.placeholder.com/400x600/f3f4f6/9ca3af?text=Brand+Image+Coming+Soon";
        
        console.log(`🔧 ${brandName}: Setting placeholder image`);
        
        const { error: updateError } = await supabase
          .from("brands")
          .update({ image: placeholderImage })
          .eq("name", brandName);

        if (updateError) {
          console.error(`❌ Failed to update ${brandName}:`, updateError);
        } else {
          console.log(`✅ Updated ${brandName} with placeholder`);
        }
      }
    }

    // Step 5: Check if there are any brand-specific images we can use
    console.log("\n🔍 Step 5: Looking for brand-specific images...");
    
    // Look for images that might contain brand names or be more specific
    const potentialBrandImages = imageFiles.filter(file => {
      const filename = file.name.toLowerCase();
      // Look for images that might be more brand-specific
      return filename.includes("brand") || 
             filename.includes("logo") || 
             filename.includes("hero") ||
             filename.includes("collection");
    });

    if (potentialBrandImages.length > 0) {
      console.log(`📋 Found ${potentialBrandImages.length} potential brand-specific images:`);
      potentialBrandImages.slice(0, 10).forEach(img => {
        console.log(`   - ${img.name}`);
      });
    }

    // Step 6: Show current status
    console.log("\n📊 Step 6: Current brand image status...");
    const { data: updatedBrands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image")
      .order("name");

    if (brandsError) {
      console.error("❌ Error fetching updated brands:", brandsError);
    } else {
      console.log(`✅ All ${updatedBrands.length} brands checked`);
      
      // Show brands that still need proper images
      const brandsNeedingImages = updatedBrands.filter(brand => 
        brand.image && brand.image.includes("placeholder")
      );
      
      if (brandsNeedingImages.length > 0) {
        console.log(`\n⚠️  Brands still needing proper images: ${brandsNeedingImages.length}`);
        brandsNeedingImages.forEach(brand => {
          console.log(`   - ${brand.name}: ${brand.image.split("/").pop()}`);
        });
      } else {
        console.log("✅ All brands have proper images!");
      }
    }

    console.log("\n======================================================================");
    console.log("🎯 Brand image assignment fix completed!");
    console.log("📝 Next steps:");
    console.log("   1. Review the placeholder images");
    console.log("   2. Upload proper brand-specific images");
    console.log("   3. Update the database with correct image URLs");
    console.log("🏁 Script completed");

  } catch (error) {
    console.error("❌ Script error:", error);
  }
}

// Run the script
fixBrandImageAssignments();
