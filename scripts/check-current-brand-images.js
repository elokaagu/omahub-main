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

async function checkCurrentBrandImages() {
  try {
    console.log("🔍 Checking current brand image status...");
    
    // Get all brands with their current images
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image, created_at")
      .order("name");
    
    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }
    
    console.log(`📋 Found ${brands.length} brands`);
    
    // Analyze image patterns
    let placeholderCount = 0;
    let uniqueImageCount = 0;
    const uniqueImages = new Set();
    const imagePatterns = {};
    
    brands.forEach(brand => {
      if (brand.image) {
        uniqueImages.add(brand.image);
        
        // Check for placeholder patterns
        if (brand.image.includes('placeholder') || brand.image.includes('via.placeholder.com')) {
          placeholderCount++;
        }
        
        // Extract filename pattern
        const filename = brand.image.split('/').pop() || '';
        if (filename) {
          imagePatterns[filename] = (imagePatterns[filename] || 0) + 1;
        }
      }
    });
    
    uniqueImageCount = uniqueImages.size;
    
    console.log(`\n📊 Image Analysis:`);
    console.log(`   🖼️ Unique images: ${uniqueImageCount}`);
    console.log(`   🖼️ Placeholder images: ${placeholderCount}`);
    console.log(`   🔄 Duplicate images: ${brands.length - uniqueImageCount}`);
    
    // Show brands with placeholders
    if (placeholderCount > 0) {
      console.log(`\n⚠️ Brands with placeholder images:`);
      brands.filter(b => b.image && (b.image.includes('placeholder') || b.image.includes('via.placeholder.com')))
        .forEach(brand => {
          console.log(`   - ${brand.name}: ${brand.image}`);
        });
    }
    
    // Show duplicate image patterns
    const duplicates = Object.entries(imagePatterns).filter(([filename, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log(`\n🔄 Duplicate image patterns:`);
      duplicates.forEach(([filename, count]) => {
        console.log(`   - ${filename}: used by ${count} brands`);
      });
    }
    
    // Show first few brands with their images
    console.log(`\n📋 Sample brand images (first 10):`);
    brands.slice(0, 10).forEach(brand => {
      const imageType = brand.image ? 
        (brand.image.includes('placeholder') ? '🖼️ Placeholder' : '🖼️ Custom') : 
        '❌ No image';
      console.log(`   - ${brand.name}: ${imageType}`);
      if (brand.image) {
        console.log(`     ${brand.image}`);
      }
    });
    
    console.log(`\n🎯 Current brand image status check completed!`);
    
  } catch (error) {
    console.error("❌ Error in checkCurrentBrandImages:", error);
  }
}

// Run the check
checkCurrentBrandImages().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
