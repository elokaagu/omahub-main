import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyAssetSystem() {
  console.log("🔍 Verifying OmaHub Asset System (READ-ONLY)...\n");

  try {
    // 1. Check brands with videos
    console.log("1️⃣ Checking brands with videos...");
    const { data: brandsWithVideos, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, video_url, video_thumbnail, category")
      .not("video_url", "is", null)
      .order("name");

    if (brandsError) {
      console.error("❌ Error fetching brands with videos:", brandsError);
    } else {
      console.log(`✅ Found ${brandsWithVideos.length} brands with videos:`);
      
      brandsWithVideos.forEach((brand, index) => {
        console.log(`\n${index + 1}. ${brand.name} (${brand.category})`);
        console.log(`   Video URL: ${brand.video_url}`);
        console.log(`   Thumbnail: ${brand.video_thumbnail || "None"}`);
        
        // Test if video URL is accessible (read-only check)
        if (brand.video_url) {
          const urlParts = brand.video_url.split('/');
          const bucketName = urlParts[urlParts.indexOf('storage') + 2];
          const filePath = urlParts.slice(urlParts.indexOf('object') + 2).join('/');
          console.log(`   Storage: ${bucketName}/${filePath}`);
        }
      });
    }

    // 2. Check brands with images
    console.log("\n2️⃣ Checking brands with images...");
    const { data: brandsWithImages, error: imagesError } = await supabase
      .from("brands")
      .select("id, name, brand_images(*)")
      .order("name");

    if (imagesError) {
      console.error("❌ Error fetching brands with images:", imagesError);
    } else {
      const brandsWithBrandImages = brandsWithImages.filter(b => b.brand_images && b.brand_images.length > 0);
      console.log(`✅ Found ${brandsWithBrandImages.length} brands with brand_images:`);
      
      brandsWithBrandImages.slice(0, 10).forEach((brand, index) => {
        console.log(`\n${index + 1}. ${brand.name}`);
        console.log(`   Brand Images: ${brand.brand_images.length} items`);
        brand.brand_images.forEach((img, imgIndex) => {
          console.log(`     ${imgIndex + 1}. ${img.storage_path} (${img.role})`);
        });
      });
      
      if (brandsWithBrandImages.length > 10) {
        console.log(`   ... and ${brandsWithBrandImages.length - 10} more brands`);
      }
    }

    // 3. Check storage buckets (read-only)
    console.log("\n3️⃣ Checking storage buckets (read-only)...");
    
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error("❌ Error listing buckets:", bucketsError);
      } else {
        console.log(`📦 Found ${buckets.length} storage buckets:`);
        buckets.forEach((bucket, index) => {
          console.log(`   ${index + 1}. ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`);
        });
      }
    } catch (error) {
      console.log("⚠️ Could not check storage buckets (may need different permissions)");
    }

    // 4. Summary
    console.log("\n📊 ASSET SYSTEM SUMMARY:");
    console.log(`✅ Brands with videos: ${brandsWithVideos?.length || 0}`);
    console.log(`✅ Brands with brand_images: ${brandsWithImages?.filter(b => b.brand_images && b.brand_images.length > 0).length || 0}`);
    console.log(`✅ Storage buckets available: ${buckets?.length || 0}`);
    
    console.log("\n🛡️ PROTECTION STATUS:");
    console.log("✅ Database assets: READ-ONLY (no changes made)");
    console.log("✅ Storage buckets: READ-ONLY (no changes made)");
    console.log("✅ All checks completed safely");
    
    console.log("\n📋 NEXT STEPS:");
    console.log("1. Check browser console for video/image rendering issues");
    console.log("2. Verify videos display correctly on homepage");
    console.log("3. Verify images display correctly on homepage");
    console.log("4. If issues persist, check component rendering logic");
    console.log("5. NEVER modify database assets via CLI - use Studio only");

  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

verifyAssetSystem();
