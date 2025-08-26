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

async function findCorrect54StitchesImage() {
  try {
    console.log("🔍 FINDING: The correct image for 54 Stitches...");
    console.log("=".repeat(70));
    console.log(
      "This will analyze all images to find the traditional Nigerian attire"
    );
    console.log("");

    // 1. Get the 54 Stitches brand
    console.log("\n📦 Step 1: Getting brand '54 Stitches'...");

    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name, image, created_at, category, description")
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
    console.log(`   🏷️ Category: ${brand.category || "Not set"}`);
    console.log(`   📝 Description: ${brand.description || "Not set"}`);
    console.log(
      `   🖼️ Current image: ${brand.image ? brand.image.split("/").pop() : "No image"}`
    );

    // 2. Get all available brand images with detailed analysis
    console.log("\n🖼️ Step 2: Analyzing all available brand images...");

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

    // 3. Analyze images by different criteria
    console.log("\n🔍 Step 3: Analyzing images by different criteria...");

    // Group images by size (larger images might be higher quality/better content)
    const imagesBySize = imageFiles
      .filter((file) => file.metadata?.size)
      .sort((a, b) => (b.metadata.size || 0) - (a.metadata.size || 0));

    console.log(`\n📏 Top 10 largest images (likely highest quality):`);
    imagesBySize.slice(0, 10).forEach((image, index) => {
      const sizeMB = ((image.metadata?.size || 0) / (1024 * 1024)).toFixed(2);
      const date = new Date(
        image.created_at || image.updated_at || 0
      ).toLocaleString();
      console.log(`   ${index + 1}. ${image.name}`);
      console.log(`      📏 Size: ${sizeMB} MB`);
      console.log(`      📅 Uploaded: ${date}`);
      console.log(
        `      🔗 URL: ${supabaseUrl}/storage/v1/object/public/brand-assets/${image.name}`
      );
    });

    // Group images by upload time (recent uploads might be the correct ones)
    const imagesByTime = imageFiles
      .filter((file) => file.created_at || file.updated_at)
      .sort((a, b) => {
        const aTime = new Date(a.created_at || a.updated_at || 0).getTime();
        const bTime = new Date(b.created_at || b.updated_at || 0).getTime();
        return bTime - aTime; // Most recent first
      });

    console.log(`\n📅 Top 10 most recently uploaded images:`);
    imagesByTime.slice(0, 10).forEach((image, index) => {
      const sizeMB = ((image.metadata?.size || 0) / (1024 * 1024)).toFixed(2);
      const date = new Date(
        image.created_at || image.updated_at || 0
      ).toLocaleString();
      console.log(`   ${index + 1}. ${image.name}`);
      console.log(`      📅 Uploaded: ${date}`);
      console.log(`      📏 Size: ${sizeMB} MB`);
      console.log(
        `      🔗 URL: ${supabaseUrl}/storage/v1/object/public/brand-assets/${image.name}`
      );
    });

    // 4. Look for images that might match the description
    console.log(
      "\n🎯 Step 4: Looking for traditional Nigerian attire images..."
    );
    console.log("   Based on your description, we're looking for:");
    console.log("   - Woman in traditional Nigerian attire");
    console.log("   - Gele headwrap");
    console.log("   - Ornate outfit");
    console.log("   - Elegant styling");
    console.log("");

    // Look for images with specific patterns that might indicate traditional attire
    const potentialTraditionalImages = imageFiles.filter((file) => {
      const filename = file.name.toLowerCase();
      // Look for images that might be related to traditional attire
      // These are educated guesses based on common naming patterns
      return (
        filename.includes("traditional") ||
        filename.includes("gele") ||
        filename.includes("attire") ||
        filename.includes("nigerian") ||
        filename.includes("african") ||
        filename.includes("cultural") ||
        filename.includes("heritage") ||
        filename.includes("celebration") ||
        filename.includes("ceremony") ||
        filename.includes("wedding") ||
        filename.includes("bridal") ||
        filename.includes("formal") ||
        filename.includes("elegant") ||
        filename.includes("ornate") ||
        filename.includes("beaded") ||
        filename.includes("embellished")
      );
    });

    if (potentialTraditionalImages.length > 0) {
      console.log(
        `🎯 Found ${potentialTraditionalImages.length} potential traditional attire images:`
      );
      potentialTraditionalImages.forEach((image, index) => {
        const sizeMB = ((image.metadata?.size || 0) / (1024 * 1024)).toFixed(2);
        const date = new Date(
          image.created_at || image.updated_at || 0
        ).toLocaleString();
        console.log(`   ${index + 1}. ${image.name}`);
        console.log(`      📏 Size: ${sizeMB} MB`);
        console.log(`      📅 Uploaded: ${date}`);
        console.log(
          `      🔗 URL: ${supabaseUrl}/storage/v1/object/public/brand-assets/${image.name}`
        );
      });
    } else {
      console.log(
        "   ℹ️ No images found with obvious traditional attire keywords"
      );
    }

    // 5. Analyze images by creation time proximity to brand creation
    console.log("\n⏱️ Step 5: Analyzing images by creation time proximity...");

    const brandCreatedAt = new Date(brand.created_at).getTime();
    const imagesWithTimeDiff = imageFiles
      .filter((file) => file.created_at || file.updated_at)
      .map((file) => {
        const imageTime = new Date(
          file.created_at || file.updated_at || 0
        ).getTime();
        const timeDiff = Math.abs(imageTime - brandCreatedAt);
        const timeDiffHours = Math.floor(timeDiff / (1000 * 60 * 60));
        const timeDiffMinutes = Math.floor(
          (timeDiff % (1000 * 60 * 60)) / (1000 * 60)
        );

        return {
          ...file,
          timeDiff,
          timeDiffHours,
          timeDiffMinutes,
        };
      })
      .sort((a, b) => a.timeDiff - b.timeDiff); // Closest time first

    console.log(
      `\n⏱️ Images closest to brand creation time (${new Date(brandCreatedAt).toLocaleString()}):`
    );
    imagesWithTimeDiff.slice(0, 15).forEach((image, index) => {
      const sizeMB = ((image.metadata?.size || 0) / (1024 * 1024)).toFixed(2);
      const date = new Date(
        image.created_at || image.updated_at || 0
      ).toLocaleString();
      const timeStr =
        image.timeDiffHours > 0
          ? `${image.timeDiffHours}h ${image.timeDiffMinutes}m`
          : `${image.timeDiffMinutes}m`;

      console.log(`   ${index + 1}. ${image.name}`);
      console.log(`      ⏱️ Time diff: ${timeStr}`);
      console.log(`      📅 Uploaded: ${date}`);
      console.log(`      📏 Size: ${sizeMB} MB`);
      console.log(
        `      🔗 URL: ${supabaseUrl}/storage/v1/object/public/brand-assets/${image.name}`
      );
    });

    // 6. Summary and recommendations
    console.log("\n" + "=".repeat(70));
    console.log("🎯 Image analysis completed!");

    console.log(`\n📊 Analysis Summary:`);
    console.log(`   📦 Brand: ${brand.name}`);
    console.log(`   🏷️ Category: ${brand.category || "Not set"}`);
    console.log(
      `   📅 Brand created: ${new Date(brand.created_at).toLocaleString()}`
    );
    console.log(`   🖼️ Total images available: ${imageFiles.length}`);

    console.log(`\n💡 Recommendations:`);
    console.log(
      `   1. Review the images above, especially the largest and most recent ones`
    );
    console.log(`   2. Look for images that show traditional Nigerian attire`);
    console.log(
      `   3. Check images uploaded around the same time as the brand creation`
    );
    console.log(
      `   4. Consider the image size - larger images are usually higher quality`
    );

    console.log(`\n🚀 Next steps:`);
    console.log(`   1. Review the image URLs above in your browser`);
    console.log(
      `   2. Identify which image shows the correct traditional Nigerian attire`
    );
    console.log(
      `   3. Let me know the filename and I'll update the brand immediately`
    );
    console.log(
      `   4. Or, if you see a pattern, I can create a more targeted search`
    );
  } catch (error) {
    console.error("❌ Error in findCorrect54StitchesImage:", error);
  }
}

// Run the image finding script
findCorrect54StitchesImage()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
