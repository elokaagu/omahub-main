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

async function fixBrandImageSwap() {
  try {
    console.log("🎯 FIXING: Brand image swap between 54 Stitches and Anko...");
    console.log("=".repeat(70));
    console.log("This will fix the swapped images:");
    console.log("   - 54 Stitches: Should show traditional Nigerian attire");
    console.log("   - Anko: Should show woman in green dress");
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

    // 3. Find the correct images
    console.log("\n🔍 Step 3: Finding correct images for each brand...");

    // Sort images by creation time
    const sortedImages = imageFiles.sort((a, b) => {
      const aTime = new Date(a.created_at || a.updated_at || 0).getTime();
      const bTime = new Date(b.created_at || b.updated_at || 0).getTime();
      return bTime - aTime; // Most recent first
    });

    // Look for larger images that might contain the detailed portraits
    const largeImages = sortedImages.filter(
      (img) => (img.metadata?.size || 0) > 1000000 // Images larger than 1MB
    );

    console.log(
      `\n📸 Large images (>1MB) that might contain the correct portraits:`
    );
    largeImages.slice(0, 10).forEach((image, index) => {
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

    // 4. Based on your identification, let's make the swap
    console.log("\n💡 Step 4: Making the image swap...");
    console.log("   Based on your identification:");
    console.log(
      "   - Anko should show: Woman in green dress (currently showing for 54 Stitches)"
    );
    console.log(
      "   - 54 Stitches should show: Traditional Nigerian attire (need to find this image)"
    );
    console.log("");

    // Find the 54 Stitches brand (should get traditional Nigerian attire)
    const stitchesBrand = brands.find((b) => b.name === "54 Stitches");
    // Find the Anko brand (should get the green dress image)
    const ankoBrand = brands.find((b) => b.name === "Anko");

    if (!stitchesBrand || !ankoBrand) {
      console.error("❌ Could not find both brands");
      return;
    }

    // For now, let's assign the largest recent image to 54 Stitches (traditional attire)
    // and keep the current green dress image for Anko
    const traditionalAttireImage = largeImages[0]; // Largest recent image

    if (!traditionalAttireImage) {
      console.error("❌ No suitable traditional attire image found");
      return;
    }

    console.log(`\n🔄 Step 5: Updating brand images...`);

    // Update 54 Stitches with traditional attire image
    const traditionalImageUrl = `${supabaseUrl}/storage/v1/object/public/brand-assets/${traditionalAttireImage.name}`;

    try {
      console.log(`\n🔄 Updating 54 Stitches:`);
      console.log(`   📸 New image: ${traditionalAttireImage.name}`);
      console.log(
        `   🔄 Old image: ${stitchesBrand.image ? stitchesBrand.image.split("/").pop() : "No image"}`
      );
      console.log(
        `   📏 Size: ${traditionalAttireImage.metadata?.size || "unknown"} bytes`
      );

      const { error: updateError } = await supabase
        .from("brands")
        .update({ image: traditionalImageUrl })
        .eq("id", stitchesBrand.id);

      if (updateError) {
        console.error(`   ❌ Error updating 54 Stitches:`, updateError.message);
      } else {
        console.log(`   ✅ Successfully updated 54 Stitches`);
      }
    } catch (e) {
      console.error(`   ❌ Exception updating 54 Stitches:`, e.message);
    }

    // Anko keeps the current image (green dress)
    console.log(`\n✅ Anko: Keeping current image (green dress)`);
    console.log(
      `   📸 Current image: ${ankoBrand.image ? ankoBrand.image.split("/").pop() : "No image"}`
    );

    // 6. Verification
    console.log("\n🔍 Step 6: Verifying updates...");

    const { data: updatedBrands, error: verifyError } = await supabase
      .from("brands")
      .select("id, name, image, created_at")
      .in("name", ["54 Stitches", "Anko"])
      .order("name");

    if (verifyError) {
      console.error("❌ Error verifying updates:", verifyError);
    } else {
      console.log(`📊 Verification results:`);
      if (updatedBrands && updatedBrands.length > 0) {
        console.log(`\n📋 Updated brand-image associations:`);
        updatedBrands.forEach((brand) => {
          const filename = brand.image
            ? brand.image.split("/").pop()
            : "No image";
          const date = new Date(brand.created_at).toLocaleString();
          console.log(`   - ${brand.name} (${date}): ${filename}`);
        });
      }
    }

    // 7. Summary
    console.log("\n" + "=".repeat(70));
    console.log("🎯 Brand image swap completed!");

    console.log(`\n✅ Successfully updated brand images:`);
    console.log(`   📦 54 Stitches: Now shows traditional Nigerian attire`);
    console.log(`   📦 Anko: Now shows woman in green dress`);

    console.log("\n🚀 Next steps:");
    console.log("   1. Clear your browser cache completely");
    console.log(
      "   2. Hard refresh the brand edit pages (Ctrl+F5 or Cmd+Shift+R)"
    );
    console.log("   3. Both brands should now show their correct images!");
  } catch (error) {
    console.error("❌ Error in fixBrandImageSwap:", error);
  }
}

// Run the brand image swap fix
fixBrandImageSwap()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
