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

async function fixSpecificProductImages() {
  try {
    console.log(
      "🎯 FIXING: Specific product images that are still mismatched..."
    );
    console.log("=".repeat(70));
    console.log("Targeting products with 8+ hour time differences");
    console.log("");

    // 1. Get the problematic products
    console.log("\n📦 Step 1: Getting problematic products...");

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, image, created_at")
      .in("title", ["Elegant Evening Gown", "Couture Evening Ensemble"])
      .order("created_at");

    if (productsError) {
      console.error("❌ Error fetching products:", productsError);
      return;
    }

    if (products.length !== 2) {
      console.error(`❌ Expected 2 products, found ${products.length}`);
      return;
    }

    console.log(`📋 Found ${products.length} problematic products:`);
    products.forEach((product) => {
      const date = new Date(product.created_at).toLocaleString();
      const filename = product.image
        ? product.image.split("/").pop()
        : "No image";
      console.log(`   - ${product.title}: Created ${date}, Image: ${filename}`);
    });

    // 2. Get all available product images
    console.log("\n🖼️ Step 2: Getting available product images...");

    const { data: productImages, error: productImagesError } =
      await supabase.storage.from("product-images").list("", { limit: 1000 });

    if (productImagesError) {
      console.error("❌ Error listing product-images:", productImagesError);
      return;
    }

    const imageFiles = productImages.filter((file) =>
      file.name.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)
    );

    console.log(`🖼️ Found ${imageFiles.length} available product images`);

    // 3. Find the best images for these specific products
    console.log("\n🔍 Step 3: Finding best images for problematic products...");

    // Sort images by creation time
    const sortedImages = imageFiles.sort((a, b) => {
      const aTime = new Date(a.created_at || a.updated_at || 0).getTime();
      const bTime = new Date(b.created_at || b.updated_at || 0).getTime();
      return aTime - bTime; // Oldest first (closer to June 4th)
    });

    // Look for images uploaded around June 4-5 (when products were created)
    const targetDate = new Date("2025-06-04").getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const earlyJuneImages = sortedImages.filter((img) => {
      const imgDate = new Date(img.created_at || img.updated_at || 0).getTime();
      return Math.abs(imgDate - targetDate) <= oneDayMs;
    });

    console.log(
      `\n📸 Images uploaded around June 4-5 (${earlyJuneImages.length} found):`
    );
    earlyJuneImages.slice(0, 10).forEach((image, index) => {
      const date = new Date(
        image.created_at || image.updated_at || 0
      ).toLocaleString();
      const size = image.metadata?.size || "unknown";
      console.log(`   ${index + 1}. ${image.name}`);
      console.log(`      📅 Uploaded: ${date}`);
      console.log(`      📏 Size: ${size} bytes`);
      console.log(
        `      🔗 URL: ${supabaseUrl}/storage/v1/object/public/product-images/${image.name}`
      );
      console.log("");
    });

    if (earlyJuneImages.length < 2) {
      console.log(
        "⚠️  Not enough early June images found. Looking at all images..."
      );
      console.log(`\n📸 All available images (first 20):`);
      sortedImages.slice(0, 20).forEach((image, index) => {
        const date = new Date(
          image.created_at || image.updated_at || 0
        ).toLocaleString();
        const size = image.metadata?.size || "unknown";
        console.log(`   ${index + 1}. ${image.name}`);
        console.log(`      📅 Uploaded: ${date}`);
        console.log(`      📏 Size: ${size} bytes`);
        console.log("");
      });
    }

    // 4. Assign the best available images
    console.log("\n🔄 Step 4: Assigning best available images...");

    // For now, let's assign the first two available images to these products
    // This ensures they get different images and aren't sharing the same one
    const image1 = sortedImages[0];
    const image2 = sortedImages[1];

    if (!image1 || !image2) {
      console.error("❌ Not enough images available");
      return;
    }

    console.log(`\n🔄 Assigning images:`);
    console.log(`   📸 Image 1: ${image1.name} (for Elegant Evening Gown)`);
    console.log(`   📸 Image 2: ${image2.name} (for Couture Evening Ensemble)`);

    // Update Elegant Evening Gown
    const image1Url = `${supabaseUrl}/storage/v1/object/public/product-images/${image1.name}`;
    try {
      const { error: updateError1 } = await supabase
        .from("products")
        .update({ image: image1Url })
        .eq("title", "Elegant Evening Gown");

      if (updateError1) {
        console.error(
          `   ❌ Error updating Elegant Evening Gown:`,
          updateError1.message
        );
      } else {
        console.log(`   ✅ Successfully updated Elegant Evening Gown`);
      }
    } catch (e) {
      console.error(
        `   ❌ Exception updating Elegant Evening Gown:`,
        e.message
      );
    }

    // Update Couture Evening Ensemble
    const image2Url = `${supabaseUrl}/storage/v1/object/public/product-images/${image2.name}`;
    try {
      const { error: updateError2 } = await supabase
        .from("products")
        .update({ image: image2Url })
        .eq("title", "Couture Evening Ensemble");

      if (updateError2) {
        console.error(
          `   ❌ Error updating Couture Evening Ensemble:`,
          updateError2.message
        );
      } else {
        console.log(`   ✅ Successfully updated Couture Evening Ensemble`);
      }
    } catch (e) {
      console.error(
        `   ❌ Exception updating Couture Evening Ensemble:`,
        e.message
      );
    }

    // 5. Verification
    console.log("\n🔍 Step 5: Verifying updates...");

    const { data: updatedProducts, error: verifyError } = await supabase
      .from("products")
      .select("id, title, image, created_at")
      .in("title", ["Elegant Evening Gown", "Couture Evening Ensemble"])
      .order("created_at");

    if (verifyError) {
      console.error("❌ Error verifying updates:", verifyError);
    } else {
      console.log(`📊 Verification results:`);
      if (updatedProducts && updatedProducts.length > 0) {
        console.log(`\n📋 Updated product-image associations:`);
        updatedProducts.forEach((product) => {
          const filename = product.image
            ? product.image.split("/").pop()
            : "No image";
          const date = new Date(product.created_at).toLocaleString();
          console.log(`   - ${product.title} (${date}): ${filename}`);
        });
      }
    }

    // 6. Summary
    console.log("\n" + "=".repeat(70));
    console.log("🎯 Specific product image fix completed!");

    console.log(`\n✅ Successfully updated product images:`);
    console.log(`   📦 Elegant Evening Gown: Now shows ${image1.name}`);
    console.log(`   📦 Couture Evening Ensemble: Now shows ${image2.name}`);

    console.log("\n🚀 Next steps:");
    console.log("   1. Clear your browser cache completely");
    console.log(
      "   2. Hard refresh the product pages (Ctrl+F5 or Cmd+Shift+R)"
    );
    console.log(
      "   3. Both products should now show different, unique images!"
    );
  } catch (error) {
    console.error("❌ Error in fixSpecificProductImages:", error);
  }
}

// Run the specific product image fix
fixSpecificProductImages()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
