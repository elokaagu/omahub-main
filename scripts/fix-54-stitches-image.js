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

async function fix54StitchesImage() {
  try {
    console.log("🎯 FIXING: 54 Stitches brand image...");
    console.log("=".repeat(70));
    console.log(
      "This will find and assign the correct traditional Nigerian attire image"
    );
    console.log("");

    // 1. Get the 54 Stitches brand
    console.log("\n📦 Step 1: Getting brand '54 Stitches'...");

    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name, image, created_at")
      .eq("name", "54 Stitches")
      .single();

    if (brandError) {
      console.error("❌ Error fetching brand:", brandError);
      return;
    }

    if (!brand) {
      console.error("❌ Brand '54 Stitches' not found");
      return;
    }

    console.log(`📋 Found brand: ${brand.name}`);
    console.log(
      `   📅 Created: ${new Date(brand.created_at).toLocaleString()}`
    );
    console.log(
      `   🖼️ Current image: ${brand.image ? brand.image.split("/").pop() : "No image"}`
    );

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

    // 3. Look for images that might be the traditional Nigerian attire
    console.log(
      "\n🔍 Step 3: Looking for traditional Nigerian attire images..."
    );

    // Sort images by creation time to see the most recent ones
    const sortedImages = imageFiles.sort((a, b) => {
      const aTime = new Date(a.created_at || a.updated_at || 0).getTime();
      const bTime = new Date(b.created_at || b.updated_at || 0).getTime();
      return bTime - aTime; // Most recent first
    });

    console.log(`\n📸 Recent brand images (first 20):`);
    sortedImages.slice(0, 20).forEach((image, index) => {
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

    // 4. Let user choose the correct image
    console.log("\n💡 Step 4: Image selection...");
    console.log(
      "   Based on your description, we're looking for an image of a woman in traditional Nigerian attire"
    );
    console.log("   with a gele headwrap, ornate outfit, and elegant styling.");
    console.log("");
    console.log(
      "   Please review the images above and let me know which filename contains the correct image."
    );
    console.log(
      "   Or, if you see the correct image in the list, I can update the brand immediately."
    );

    // 5. For now, let's try to find a better match based on creation time
    console.log("\n🔍 Step 5: Finding better time-based match...");

    const brandCreatedAt = new Date(brand.created_at).getTime();

    // Find the closest image by creation time
    let bestImage = null;
    let smallestTimeDiff = Infinity;

    sortedImages.forEach((image) => {
      const imageCreatedAt = new Date(
        image.created_at || image.updated_at || 0
      ).getTime();
      const timeDiff = Math.abs(brandCreatedAt - imageCreatedAt);

      if (timeDiff < smallestTimeDiff) {
        smallestTimeDiff = timeDiff;
        bestImage = image;
      }
    });

    if (bestImage) {
      const timeDiffHours = Math.round(smallestTimeDiff / 1000 / 1000 / 60);
      const timeDiffMinutes = Math.round(smallestTimeDiff / 1000 / 60);

      console.log(`\n🎯 Best time-based match for ${brand.name}:`);
      console.log(
        `   📅 Brand created: ${new Date(brand.created_at).toLocaleString()}`
      );
      console.log(
        `   🖼️ Image uploaded: ${new Date(bestImage.created_at || bestImage.updated_at || 0).toLocaleString()}`
      );
      console.log(
        `   ⏱️ Time difference: ${timeDiffHours} hours (${timeDiffMinutes} minutes)`
      );
      console.log(`   📸 Image: ${bestImage.name}`);
      console.log(`   📏 Size: ${bestImage.metadata?.size || "unknown"} bytes`);

      // Check if this image is already used by another brand
      const { data: existingUsage, error: usageError } = await supabase
        .from("brands")
        .select("id, name")
        .eq(
          "image",
          `${supabaseUrl}/storage/v1/object/public/brand-assets/${bestImage.name}`
        );

      if (usageError) {
        console.error("❌ Error checking image usage:", usageError);
      } else if (existingUsage && existingUsage.length > 0) {
        console.log(`\n⚠️ This image is already used by:`);
        existingUsage.forEach((b) => {
          if (b.id !== brand.id) {
            console.log(`   - ${b.name}`);
          }
        });
      } else {
        console.log(`\n✅ This image is available for use`);
      }
    }

    // 6. Summary and next steps
    console.log("\n" + "=".repeat(70));
    console.log("🎯 54 Stitches image analysis completed!");

    console.log(`\n📊 Current status:`);
    console.log(`   📦 Brand: ${brand.name}`);
    console.log(
      `   🖼️ Current image: ${brand.image ? brand.image.split("/").pop() : "No image"}`
    );
    console.log(
      `   📅 Brand created: ${new Date(brand.created_at).toLocaleString()}`
    );

    console.log(`\n💡 To fix this:`);
    console.log(`   1. Review the image list above`);
    console.log(
      `   2. Identify the filename containing the traditional Nigerian attire image`
    );
    console.log(
      `   3. Let me know the filename and I'll update the brand immediately`
    );

    console.log(
      `\n🚀 Alternative: I can run a script to find and assign the best available image`
    );
  } catch (error) {
    console.error("❌ Error in fix54StitchesImage:", error);
  }
}

// Run the 54 Stitches fix
fix54StitchesImage()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
