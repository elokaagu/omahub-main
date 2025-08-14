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

async function investigateBrandImageLoss() {
  try {
    console.log("🔍 Investigating brand image loss...");
    
    // 1. Check current brand images
    console.log("\n📊 Step 1: Checking current brand images...");
    
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image, created_at")
      .order("name");
    
    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }
    
    console.log(`📋 Found ${brands.length} brands`);
    
    // Check for placeholder images
    let placeholderCount = 0;
    let uniqueImageCount = 0;
    const uniqueImages = new Set();
    
    brands.forEach(brand => {
      if (brand.image && brand.image.includes('placeholder')) {
        placeholderCount++;
      }
      if (brand.image) {
        uniqueImages.add(brand.image);
      }
    });
    
    uniqueImageCount = uniqueImages.size;
    
    console.log(`   📸 Unique images: ${uniqueImageCount}`);
    console.log(`   🖼️ Placeholder images: ${placeholderCount}`);
    console.log(`   🔄 Duplicate images: ${brands.length - uniqueImageCount}`);
    
    // 2. Check all storage buckets for potential original images
    console.log("\n📦 Step 2: Searching all storage buckets for original images...");
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error("❌ Error listing buckets:", bucketsError);
    } else {
      console.log(`📋 Found ${buckets.length} storage buckets`);
      
      for (const bucket of buckets) {
        console.log(`\n🔍 Searching bucket: ${bucket.name}`);
        
        try {
          const { data: files, error: listError } = await supabase.storage
            .from(bucket.name)
            .list("", { limit: 1000 });
          
          if (listError) {
            console.log(`   ❌ Error listing files: ${listError.message}`);
          } else {
            // Look for image files
            const imageFiles = files.filter(file => 
              file.name.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)
            );
            
            if (imageFiles.length > 0) {
              console.log(`   🖼️ Found ${imageFiles.length} image files`);
              
              // Look for brand-specific folders or files
              const brandImages = imageFiles.filter(file => 
                file.name.includes('brand') || 
                file.name.includes('logo') ||
                file.name.includes('designer')
              );
              
              if (brandImages.length > 0) {
                console.log(`   🏷️ Potential brand images: ${brandImages.length}`);
                brandImages.slice(0, 5).forEach(file => {
                  console.log(`      - ${file.name}`);
                });
                if (brandImages.length > 5) {
                  console.log(`      ... and ${brandImages.length - 5} more`);
                }
              }
            } else {
              console.log(`   📁 No image files found`);
            }
          }
        } catch (bucketError) {
          console.log(`   ❌ Error accessing bucket: ${bucketError.message}`);
        }
      }
    }
    
    // 3. Check if there are any backup tables or archived data
    console.log("\n🗄️ Step 3: Checking for backup data...");
    
    const backupTableNames = [
      'brands_backup', 'brands_archive', 'brands_old',
      'brand_images_backup', 'brand_images_archive'
    ];
    
    for (const tableName of backupTableNames) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("id, name, image")
          .limit(1);
        
        if (!error) {
          console.log(`✅ Found backup table: ${tableName}`);
          
          // Get all records
          const { data: allData, error: allError } = await supabase
            .from(tableName)
            .select("id, name, image");
          
          if (!allError && allData) {
            console.log(`   📋 Records: ${allData.length}`);
            console.log(`   📊 Sample: ${allData[0]?.name} - ${allData[0]?.image}`);
          }
        }
      } catch (e) {
        // Table doesn't exist, which is expected
      }
    }
    
    // 4. Check if there are any database functions that might have backup data
    console.log("\n🔧 Step 4: Checking for backup functions...");
    
    try {
      const { data: functions, error: funcError } = await supabase.rpc('get_all_functions');
      if (!funcError && functions) {
        const backupFunctions = functions.filter(f => 
          f.name.toLowerCase().includes('backup') || 
          f.name.toLowerCase().includes('restore') ||
          f.name.toLowerCase().includes('archive')
        );
        
        if (backupFunctions.length > 0) {
          console.log(`   🔧 Found ${backupFunctions.length} backup-related functions:`);
          backupFunctions.forEach(f => console.log(`      - ${f.name}`));
        }
      }
    } catch (e) {
      console.log("   🔧 Could not check database functions");
    }
    
    // 5. Summary and recommendations
    console.log("\n📊 Investigation Summary:");
    console.log(`   🏷️ Total brands: ${brands.length}`);
    console.log(`   🖼️ Unique images: ${uniqueImageCount}`);
    console.log(`   🖼️ Placeholder images: ${placeholderCount}`);
    console.log(`   🔄 Duplicate images: ${brands.length - uniqueImageCount}`);
    
    console.log("\n🎯 Recommendations:");
    if (placeholderCount > 0) {
      console.log("   ❌ Many brands have placeholder images - need to restore originals");
    }
    if (uniqueImageCount < brands.length * 0.5) {
      console.log("   ⚠️ Too many duplicate images - suggests image assignment went wrong");
    }
    
    console.log("\n🔍 Brand image investigation completed!");
    
  } catch (error) {
    console.error("❌ Error in investigateBrandImageLoss:", error);
  }
}

// Run the investigation
investigateBrandImageLoss().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
