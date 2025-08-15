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

async function fixBothBrands() {
  try {
    console.log("🎯 FIXING: Both 54 Stitches and Anko brand images...");
    console.log("=".repeat(70));
    console.log("This will fix the incorrect images for both brands");
    console.log("");

    // 1. Get both brands
    console.log("\n📦 Step 1: Getting both brands...");

    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image, created_at")
      .in("name", ["54 Stitches", "Anko"])
      .order("name");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    if (brands.length !== 2) {
      console.error(`❌ Expected 2 brands, found ${brands.length}`);
      return;
    }

    console.log(`📋 Found ${brands.length} brands:`);
    brands.forEach((brand) => {
      const date = new Date(brand.created_at).toLocaleString();
      const filename = brand.image ? brand.image.split("/").pop() : "No image";
      console.log(`   - ${brand.name}: Created ${date}, Image: ${filename}`);
    });

    // 2. Get all available brand images
    console.log("\n🖼️ Step 2: Getting available brand images...");

    const { data: brandImages, error: brandImagesError } =
      await supabase.storage.from("brand-assets").list("", { limit: 1000 });

    if (brandImagesError) {
      console.error("❌ Error listing brand-assets:", brandImagesError);
      return;
    }

    const imageFiles = brandImages.filter((file) =>
      file.name.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)
    );

    console.log(`🖼️ Found ${imageFiles.length} available brand images`);

    // 3. Find the correct images based on descriptions
    console.log("\n🔍 Step 3: Finding correct images for each brand...");

    // Sort images by creation time
    const sortedImages = imageFiles.sort((a, b) => {
      const aTime = new Date(a.created_at || a.updated_at || 0).getTime();
      const bTime = new Date(b.created_at || b.updated_at || 0).getTime();
      return bTime - aTime; // Most recent first
    });

    console.log(`\n📸 Available brand images (first 30):`);
    sortedImages.slice(0, 30).forEach((image, index) => {
      const date = new Date(
        image.created_at || image.updated_at || 0
      ).toLocaleString();
      const size = image.metadata?.size || "unknown";
      console.log(`   ${index + 1}. ${image.name}`);
      console.log(`      📅 Uploaded: ${date}`);
      console.log(`      📏 Size: ${size} bytes`);
      console.log("");
    });

    // 4. Based on the descriptions, let's identify the correct images
    console.log("\n💡 Step 4: Image identification...");
    console.log("   Based on your descriptions:");
    console.log(
      "   - 54 Stitches should show: Woman in traditional Nigerian attire with gele headwrap"
    );
    console.log(
      "   - Anko should show: Woman in white tank top with 'Obeme' by the sea"
    );
    console.log("");
    console.log(
      "   Looking at the current assignments, it seems the images got swapped!"
    );
    console.log("   Let me find the correct images and fix this...");

    // 5. Find images that match the descriptions
    console.log("\n🔍 Step 5: Finding matching images...");

    // Look for larger images that might contain the detailed portraits
    const largeImages = sortedImages.filter(
      (img) => (img.metadata?.size || 0) > 1000000 // Images larger than 1MB
    );

    console.log(
      `\n📸 Large images (>1MB) that might contain the correct portraits:`
    );
    largeImages.slice(0, 15).forEach((image, index) => {
      const date = new Date(
        image.created_at || image.updated_at || 0
      ).toLocaleString();
      const size = image.metadata?.size || "unknown";
      console.log(`   ${index + 1}. ${image.name}`);
      console.log(`      📅 Uploaded: ${date}`);
      console.log(`      📏 Size: ${size} bytes`);
      console.log(
        `      🔗 URL: ${supabaseUrl}/storage/v1/object/public/brand-assets/${image.name}`
      );
      console.log("");
    });

    // 6. Let user identify the correct images
    console.log("\n💡 Step 6: User identification needed...");
    console.log("   Please review the images above and tell me:");
    console.log(
      "   1. Which filename contains the traditional Nigerian attire image (for 54 Stitches)"
    );
    console.log(
      "   2. Which filename contains the 'Obeme' tank top image (for Anko)"
    );
    console.log("");
    console.log(
      "   Once you identify them, I can immediately swap the images correctly!"
    );

    // 7. Summary
    console.log("\n" + "=".repeat(70));
    console.log("🎯 Both brand image analysis completed!");

    console.log(`\n📊 Current status:`);
    brands.forEach((brand) => {
      const filename = brand.image ? brand.image.split("/").pop() : "No image";
      const date = new Date(brand.created_at).toLocaleString();
      console.log(`   📦 ${brand.name}: ${filename} (Created: ${date})`);
    });

    console.log(`\n💡 To fix this:`);
    console.log(`   1. Review the image list above`);
    console.log(`   2. Identify the correct filenames for each brand`);
    console.log(`   3. Let me know and I'll update both brands immediately`);
  } catch (error) {
    console.error("❌ Error in fixBothBrands:", error);
  }
}

// Run the both brands fix
fixBothBrands()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
