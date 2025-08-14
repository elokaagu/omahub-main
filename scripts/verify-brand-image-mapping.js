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

async function verifyBrandImageMapping() {
  try {
    console.log("🔍 Verifying brand-image mapping accuracy...");
    
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
    
    // Check if images are accessible
    console.log("\n🔍 Step 1: Checking image accessibility...");
    
    let accessibleImages = 0;
    let inaccessibleImages = 0;
    
    for (const brand of brands.slice(0, 10)) { // Check first 10 to avoid timeout
      try {
        const response = await fetch(brand.image);
        if (response.ok) {
          accessibleImages++;
          console.log(`   ✅ ${brand.name}: Image accessible`);
        } else {
          inaccessibleImages++;
          console.log(`   ❌ ${brand.name}: Image not accessible (${response.status})`);
        }
      } catch (error) {
        inaccessibleImages++;
        console.log(`   ❌ ${brand.name}: Image error - ${error.message}`);
      }
    }
    
    console.log(`\n📊 Image Accessibility:`);
    console.log(`   ✅ Accessible: ${accessibleImages}`);
    console.log(`   ❌ Inaccessible: ${inaccessibleImages}`);
    
    // Check for potential image mismatches
    console.log("\n🔍 Step 2: Checking for image mismatches...");
    
    // Look for brands that might have wrong images
    const suspiciousBrands = brands.filter(brand => {
      // Check if image filename seems unrelated to brand name
      const filename = brand.image.split('/').pop() || '';
      const brandNameLower = brand.name.toLowerCase();
      
      // Look for patterns that suggest mismatch
      if (filename.includes('brands') && !brandNameLower.includes('brand')) {
        return true;
      }
      
      // Check if filename has date patterns that don't match brand creation
      const dateMatch = filename.match(/\d{10,}/);
      if (dateMatch) {
        const timestamp = parseInt(dateMatch[0]);
        const brandDate = new Date(brand.created_at).getTime() / 1000;
        const diffDays = Math.abs(timestamp - brandDate) / (24 * 60 * 60);
        
        // If timestamp is more than 30 days different from brand creation
        if (diffDays > 30) {
          return true;
        }
      }
      
      return false;
    });
    
    if (suspiciousBrands.length > 0) {
      console.log(`   ⚠️ Found ${suspiciousBrands.length} potentially mismatched brands:`);
      suspiciousBrands.forEach(brand => {
        const filename = brand.image.split('/').pop() || '';
        console.log(`      - ${brand.name}: ${filename}`);
      });
    } else {
      console.log("   ✅ No obvious image mismatches detected");
    }
    
    // Check if we have the original brand images somewhere
    console.log("\n🔍 Step 3: Looking for original brand images...");
    
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (!bucketsError) {
        for (const bucket of buckets) {
          if (bucket.name.includes('brand') || bucket.name.includes('product')) {
            console.log(`\n🔍 Checking bucket: ${bucket.name}`);
            
            try {
              const { data: files, error: listError } = await supabase.storage
                .from(bucket.name)
                .list("", { limit: 100 });
              
              if (!listError && files) {
                const imageFiles = files.filter(file => 
                  file.name.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)
                );
                
                if (imageFiles.length > 0) {
                  console.log(`   🖼️ Found ${imageFiles.length} image files`);
                  
                  // Look for brand-specific images
                  const brandImages = imageFiles.filter(file => 
                    file.name.includes('brand') || 
                    file.name.includes('logo') ||
                    file.name.includes('designer')
                  );
                  
                  if (brandImages.length > 0) {
                    console.log(`   🏷️ Brand-related images: ${brandImages.length}`);
                    brandImages.slice(0, 5).forEach(file => {
                      console.log(`      - ${file.name}`);
                    });
                  }
                }
              }
            } catch (bucketError) {
              console.log(`   ❌ Error accessing bucket: ${bucketError.message}`);
            }
          }
        }
      }
    } catch (e) {
      console.log("   ❌ Error checking storage buckets");
    }
    
    console.log("\n🎯 Brand image mapping verification completed!");
    
  } catch (error) {
    console.error("❌ Error in verifyBrandImageMapping:", error);
  }
}

// Run the verification
verifyBrandImageMapping().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
