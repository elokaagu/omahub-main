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

async function analyzeBrandImageConsistency() {
  try {
    console.log("🔍 ANALYZING: Brand image consistency issues...");
    console.log("=".repeat(70));
    console.log("This will investigate why brand images are sometimes correct and sometimes not");
    console.log("");

    // 1. Check the current state of all brands and their images
    console.log("\n📦 Step 1: Checking all brands and their current images...");

    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image, created_at, updated_at, category")
      .order("name");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    console.log(`📋 Found ${brands.length} brands in the database`);

    // 2. Analyze image consistency patterns
    console.log("\n🔍 Step 2: Analyzing image consistency patterns...");

    const brandsWithImages = brands.filter(brand => brand.image);
    const brandsWithoutImages = brands.filter(brand => !brand.image);

    console.log(`📊 Image assignment statistics:`);
    console.log(`   ✅ Brands with images: ${brandsWithImages.length}`);
    console.log(`   ❌ Brands without images: ${brandsWithoutImages.length}`);
    console.log(`   📈 Coverage: ${((brandsWithImages.length / brands.length) * 100).toFixed(1)}%`);

    // 3. Check for duplicate image usage
    console.log("\n🔄 Step 3: Checking for duplicate image usage...");

    const imageUsage = new Map();
    brandsWithImages.forEach(brand => {
      const imageUrl = brand.image;
      if (!imageUsage.has(imageUrl)) {
        imageUsage.set(imageUrl, []);
      }
      imageUsage.get(imageUrl).push(brand);
    });

    const duplicateImages = Array.from(imageUsage.entries())
      .filter(([imageUrl, brands]) => brands.length > 1);

    if (duplicateImages.length > 0) {
      console.log(`⚠️ Found ${duplicateImages.length} images used by multiple brands:`);
      duplicateImages.forEach(([imageUrl, brands]) => {
        const filename = imageUrl.split("/").pop();
        console.log(`\n   🖼️ Image: ${filename}`);
        console.log(`   🔗 URL: ${imageUrl}`);
        console.log(`   📦 Used by ${brands.length} brands:`);
        brands.forEach(brand => {
          console.log(`      - ${brand.name} (${brand.category || 'No category'})`);
        });
      });
    } else {
      console.log("✅ No duplicate image usage found");
    }

    // 4. Check for orphaned images (images in storage but not used by any brand)
    console.log("\n👻 Step 4: Checking for orphaned images...");

    const { data: storageImages, error: storageError } = await supabase.storage
      .from("brand-assets")
      .list("", { limit: 1000 });

    if (storageError) {
      console.error("❌ Error listing storage images:", storageError);
      return;
    }

    const usedImageUrls = new Set(brandsWithImages.map(brand => brand.image));
    const orphanedImages = storageImages.filter(file => {
      const imageUrl = `${supabaseUrl}/storage/v1/object/public/brand-assets/${file.name}`;
      return !usedImageUrls.has(imageUrl);
    });

    console.log(`📊 Storage vs. Database analysis:`);
    console.log(`   🗄️ Images in storage: ${storageImages.length}`);
    console.log(`   🔗 Images used by brands: ${usedImageUrls.size}`);
    console.log(`   👻 Orphaned images: ${orphanedImages.length}`);

    if (orphanedImages.length > 0) {
      console.log(`\n👻 Top 10 orphaned images (not used by any brand):`);
      orphanedImages.slice(0, 10).forEach((image, index) => {
        const sizeMB = ((image.metadata?.size || 0) / (1024 * 1024)).toFixed(2);
        const date = new Date(image.created_at || image.updated_at || 0).toLocaleString();
        console.log(`   ${index + 1}. ${image.name}`);
        console.log(`      📏 Size: ${sizeMB} MB`);
        console.log(`      📅 Uploaded: ${date}`);
        console.log(`      🔗 URL: ${supabaseUrl}/storage/v1/object/public/brand-assets/${image.name}`);
      });
    }

    // 5. Check for brands with placeholder or generic images
    console.log("\n🎭 Step 5: Checking for brands with placeholder/generic images...");

    const potentialPlaceholderImages = brandsWithImages.filter(brand => {
      const imageUrl = brand.image.toLowerCase();
      return (
        imageUrl.includes('placeholder') ||
        imageUrl.includes('default') ||
        imageUrl.includes('generic') ||
        imageUrl.includes('sample') ||
        imageUrl.includes('demo') ||
        imageUrl.includes('temp') ||
        imageUrl.includes('test')
      );
    });

    if (potentialPlaceholderImages.length > 0) {
      console.log(`⚠️ Found ${potentialPlaceholderImages.length} brands with potential placeholder images:`);
      potentialPlaceholderImages.forEach(brand => {
        const filename = brand.image.split("/").pop();
        console.log(`   📦 ${brand.name}: ${filename}`);
      });
    } else {
      console.log("✅ No obvious placeholder images found");
    }

    // 6. Check for brands with very old or very recent image updates
    console.log("\n⏰ Step 6: Checking image update timing patterns...");

    const brandsWithRecentUpdates = brandsWithImages.filter(brand => {
      if (!brand.updated_at) return false;
      const updateTime = new Date(brand.updated_at).getTime();
      const now = Date.now();
      const daysSinceUpdate = (now - updateTime) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate < 7; // Updated in last 7 days
    });

    const brandsWithOldUpdates = brandsWithImages.filter(brand => {
      if (!brand.updated_at) return false;
      const updateTime = new Date(brand.updated_at).getTime();
      const now = Date.now();
      const daysSinceUpdate = (now - updateTime) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate > 30; // Not updated in last 30 days
    });

    console.log(`📅 Image update timing analysis:`);
    console.log(`   🔄 Recently updated (last 7 days): ${brandsWithRecentUpdates.length}`);
    console.log(`   📅 Not updated recently (30+ days): ${brandsWithOldUpdates.length}`);

    // 7. Check for brands with missing or invalid image URLs
    console.log("\n🔗 Step 7: Checking for invalid image URLs...");

    const brandsWithInvalidUrls = brandsWithImages.filter(brand => {
      try {
        new URL(brand.image);
        return false; // Valid URL
      } catch {
        return true; // Invalid URL
      }
    });

    if (brandsWithInvalidUrls.length > 0) {
      console.log(`❌ Found ${brandsWithInvalidUrls.length} brands with invalid image URLs:`);
      brandsWithInvalidUrls.forEach(brand => {
        console.log(`   📦 ${brand.name}: ${brand.image}`);
      });
    } else {
      console.log("✅ All brand image URLs are valid");
    }

    // 8. Check for brands that might have been created without proper image assignment
    console.log("\n🆕 Step 8: Checking brands created without proper image assignment...");

    const brandsCreatedWithoutImages = brands.filter(brand => {
      // Check if brand was created but image was added much later
      if (!brand.image) return true;
      
      const brandCreated = new Date(brand.created_at).getTime();
      const imageUpdated = brand.updated_at ? new Date(brand.updated_at).getTime() : brandCreated;
      const timeDiff = imageUpdated - brandCreated;
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      return hoursDiff > 24; // Image added more than 24 hours after brand creation
    });

    console.log(`📊 Brands with delayed image assignment: ${brandsCreatedWithoutImages.length}`);
    if (brandsCreatedWithoutImages.length > 0) {
      console.log(`\n📦 Examples of brands with delayed image assignment:`);
      brandsCreatedWithoutImages.slice(0, 5).forEach(brand => {
        const brandCreated = new Date(brand.created_at).toLocaleString();
        const imageUpdated = brand.updated_at ? new Date(brand.updated_at).toLocaleString() : 'Never';
        console.log(`   📦 ${brand.name}:`);
        console.log(`      📅 Created: ${brandCreated}`);
        console.log(`      🖼️ Image updated: ${imageUpdated}`);
      });
    }

    // 9. Summary and recommendations
    console.log("\n" + "=".repeat(70));
    console.log("🎯 Brand image consistency analysis completed!");

    console.log(`\n📊 Summary of findings:`);
    console.log(`   📦 Total brands: ${brands.length}`);
    console.log(`   ✅ Brands with images: ${brandsWithImages.length}`);
    console.log(`   ❌ Brands without images: ${brandsWithoutImages.length}`);
    console.log(`   🔄 Duplicate image usage: ${duplicateImages.length}`);
    console.log(`   👻 Orphaned images: ${orphanedImages.length}`);
    console.log(`   🎭 Potential placeholder images: ${potentialPlaceholderImages.length}`);
    console.log(`   🔗 Invalid URLs: ${brandsWithInvalidUrls.length}`);

    console.log(`\n💡 Root causes identified:`);
    if (duplicateImages.length > 0) {
      console.log(`   🔄 Multiple brands sharing the same image (${duplicateImages.length} cases)`);
    }
    if (orphanedImages.length > 0) {
      console.log(`   👻 Images uploaded but never assigned to brands (${orphanedImages.length} cases)`);
    }
    if (brandsCreatedWithoutImages.length > 0) {
      console.log(`   🆕 Brands created without immediate image assignment (${brandsCreatedWithoutImages.length} cases)`);
    }
    if (brandsWithInvalidUrls.length > 0) {
      console.log(`   🔗 Invalid image URLs in database (${brandsWithInvalidUrls.length} cases)`);
    }

    console.log(`\n🚀 Recommendations:`);
    console.log(`   1. Review and fix duplicate image assignments`);
    console.log(`   2. Assign orphaned images to appropriate brands`);
    console.log(`   3. Implement image validation during brand creation`);
    console.log(`   4. Add image assignment workflow to brand creation process`);
    console.log(`   5. Regular cleanup of unused images in storage`);

    console.log(`\n🔧 Next steps:`);
    console.log(`   1. Review the duplicate image cases above`);
    console.log(`   2. Check orphaned images for potential brand matches`);
    console.log(`   3. Implement proper image assignment during brand creation`);
    console.log(`   4. Set up regular image consistency checks`);

  } catch (error) {
    console.error("❌ Error in analyzeBrandImageConsistency:", error);
  }
}

// Run the analysis
analyzeBrandImageConsistency()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
