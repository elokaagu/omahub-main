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

async function checkImageUsage() {
  try {
    console.log("🔍 CHECKING: Brand image usage and conflicts...");
    console.log("=".repeat(70));
    console.log("This will identify any brands sharing the same images");
    console.log("");
    
    // 1. Get all brands with their images
    console.log("\n📦 Step 1: Getting all brands...");
    
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image, created_at")
      .order("name");
    
    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }
    
    console.log(`📋 Found ${brands.length} brands`);
    
    // 2. Analyze image usage
    console.log("\n🖼️ Step 2: Analyzing image usage...");
    
    const imageUsage = new Map();
    const brandsWithoutImages = [];
    
    brands.forEach(brand => {
      if (brand.image) {
        const filename = brand.image.split('/').pop();
        if (imageUsage.has(filename)) {
          imageUsage.get(filename).push(brand);
        } else {
          imageUsage.set(filename, [brand]);
        }
      } else {
        brandsWithoutImages.push(brand);
      }
    });
    
    // 3. Check for duplicate image usage
    console.log("\n🔍 Step 3: Checking for duplicate image usage...");
    
    const duplicates = Array.from(imageUsage.entries())
      .filter(([filename, brands]) => brands.length > 1);
    
    if (duplicates.length > 0) {
      console.log(`❌ Found ${duplicates.length} images used by multiple brands:`);
      
      duplicates.forEach(([filename, brands]) => {
        console.log(`\n📸 Image: ${filename}`);
        brands.forEach(brand => {
          const date = new Date(brand.created_at).toLocaleString();
          console.log(`   - ${brand.name} (Created: ${date})`);
        });
      });
    } else {
      console.log(`✅ No duplicate image usage found`);
    }
    
    // 4. Check specific brand "54 Stitches"
    console.log("\n🎯 Step 4: Checking '54 Stitches' specifically...");
    
    const stitchesBrand = brands.find(b => b.name === "54 Stitches");
    if (stitchesBrand) {
      console.log(`📋 Brand: ${stitchesBrand.name}`);
      console.log(`   📅 Created: ${new Date(stitchesBrand.created_at).toLocaleString()}`);
      console.log(`   🖼️ Image: ${stitchesBrand.image ? stitchesBrand.image.split('/').pop() : 'No image'}`);
      
      if (stitchesBrand.image) {
        const filename = stitchesBrand.image.split('/').pop();
        const usage = imageUsage.get(filename);
        
        if (usage && usage.length > 1) {
          console.log(`   ⚠️ This image is shared with:`);
          usage.forEach(brand => {
            if (brand.id !== stitchesBrand.id) {
              console.log(`      - ${brand.name}`);
            }
          });
        } else {
          console.log(`   ✅ This image is unique to this brand`);
        }
        
        // Check if the image actually exists in storage
        console.log(`\n🔍 Step 5: Verifying image exists in storage...`);
        
        const { data: imageExists, error: storageError } = await supabase.storage
          .from("brand-assets")
          .list("", { limit: 1000 });
        
        if (storageError) {
          console.error("❌ Error checking storage:", storageError);
        } else {
          const fileExists = imageExists.find(file => file.name === filename);
          if (fileExists) {
            console.log(`   ✅ Image file exists in storage`);
            console.log(`   📏 Size: ${fileExists.metadata?.size || 'unknown'} bytes`);
            console.log(`   📅 Uploaded: ${new Date(fileExists.created_at || fileExists.updated_at || 0).toLocaleString()}`);
          } else {
            console.log(`   ❌ Image file NOT found in storage!`);
            console.log(`   💡 This explains why the wrong image is showing`);
          }
        }
      }
    } else {
      console.log(`❌ Brand '54 Stitches' not found`);
    }
    
    // 5. Summary and recommendations
    console.log("\n" + "=".repeat(70));
    console.log("🎯 Brand image usage analysis completed!");
    
    if (duplicates.length > 0) {
      console.log(`\n❌ Found ${duplicates.length} images used by multiple brands`);
      console.log(`   This could cause confusion and incorrect image display`);
      
      console.log("\n💡 Recommendations:");
      console.log("   1. Each brand should have a unique image");
      console.log("   2. Run the brand image fix script to resolve duplicates");
      console.log("   3. Clear browser cache after fixes");
    } else {
      console.log(`\n✅ All brands have unique images`);
    }
    
    if (brandsWithoutImages.length > 0) {
      console.log(`\n⚠️ ${brandsWithoutImages.length} brands have no images`);
      console.log(`   These will show placeholder images`);
    }
    
    console.log(`\n📊 Final analysis:`);
    console.log(`   📦 Total brands: ${brands.length}`);
    console.log(`   🖼️ Unique images: ${imageUsage.size}`);
    console.log(`   🔄 Duplicate images: ${duplicates.length}`);
    console.log(`   ❌ Brands without images: ${brandsWithoutImages.length}`);
    
  } catch (error) {
    console.error("❌ Error in checkImageUsage:", error);
  }
}

// Run the image usage check
checkImageUsage().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
