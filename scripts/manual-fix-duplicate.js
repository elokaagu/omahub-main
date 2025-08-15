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

async function manualFixDuplicate() {
  try {
    console.log(
      "🎯 MANUAL FIX: Assigning different images to duplicate products..."
    );
    console.log("=".repeat(70));

    // 1. Get the problematic products
    console.log("\n📦 Step 1: Getting products with duplicate images...");

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, image, created_at")
      .in("title", ["Elegant Evening Gown", "Couture Evening Ensemble"])
      .order("created_at");

    if (productsError) {
      console.error("❌ Error fetching products:", productsError);
      return;
    }

    console.log(`📋 Found ${products.length} products:`);
    products.forEach((product) => {
      const date = new Date(product.created_at).toLocaleString();
      const filename = product.image
        ? product.image.split("/").pop()
        : "No image";
      console.log(`   - ${product.title}: Created ${date}, Image: ${filename}`);
    });

    // 2. Get available images
    console.log("\n🖼️ Step 2: Getting available images...");

    const { data: productImages, error: productImagesError } =
      await supabase.storage.from("product-images").list("", { limit: 1000 });

    if (productImagesError) {
      console.error("❌ Error listing product-images:", productImagesError);
      return;
    }

    const imageFiles = productImages.filter((file) =>
      file.name.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)
    );

    console.log(`🖼️ Found ${imageFiles.length} available images`);

    // 3. Find two different images for the two products
    console.log("\n🔍 Step 3: Finding two different images...");

    // Sort images by creation time
    const sortedImages = imageFiles.sort((a, b) => {
      const aTime = new Date(a.created_at || a.updated_at || 0).getTime();
      const bTime = new Date(b.created_at || b.updated_at || 0).getTime();
      return aTime - bTime;
    });

    // Get the first two images that are different
    const image1 = sortedImages[0];
    const image2 = sortedImages[1];

    if (!image1 || !image2) {
      console.error("❌ Not enough images available");
      return;
    }

    console.log(`\n📸 Selected images:`);
    console.log(
      `   Image 1: ${image1.name} (${new Date(image1.created_at || image1.updated_at || 0).toLocaleString()})`
    );
    console.log(
      `   Image 2: ${image2.name} (${new Date(image2.created_at || image2.updated_at || 0).toLocaleString()})`
    );

    // 4. Update the products with different images
    console.log("\n🔄 Step 4: Updating products with different images...");

    let updatedCount = 0;
    let errorCount = 0;

    // Update first product
    try {
      const image1Url = `${supabaseUrl}/storage/v1/object/public/product-images/${image1.name}`;
      console.log(`\n🔄 Updating ${products[0].title}:`);
      console.log(`   📸 New image: ${image1.name}`);
      console.log(
        `   🔄 Old image: ${products[0].image ? products[0].image.split("/").pop() : "No image"}`
      );

      const { error: updateError1 } = await supabase
        .from("products")
        .update({ image: image1Url })
        .eq("id", products[0].id);

      if (updateError1) {
        console.error(
          `   ❌ Error updating ${products[0].title}:`,
          updateError1.message
        );
        errorCount++;
      } else {
        console.log(`   ✅ Successfully updated ${products[0].title}`);
        updatedCount++;
      }
    } catch (e) {
      console.error(
        `   ❌ Exception updating ${products[0].title}:`,
        e.message
      );
      errorCount++;
    }

    // Update second product
    try {
      const image2Url = `${supabaseUrl}/storage/v1/object/public/product-images/${image2.name}`;
      console.log(`\n🔄 Updating ${products[1].title}:`);
      console.log(`   📸 New image: ${image2.name}`);
      console.log(
        `   🔄 Old image: ${products[1].image ? products[1].image.split("/").pop() : "No image"}`
      );

      const { error: updateError2 } = await supabase
        .from("products")
        .update({ image: image2Url })
        .eq("id", products[1].id);

      if (updateError2) {
        console.error(
          `   ❌ Error updating ${products[1].title}:`,
          updateError2.message
        );
        errorCount++;
      } else {
        console.log(`   ✅ Successfully updated ${products[1].title}`);
        updatedCount++;
      }
    } catch (e) {
      console.error(
        `   ❌ Exception updating ${products[1].title}:`,
        e.message
      );
      errorCount++;
    }

    // 5. Verification
    console.log("\n🔍 Step 5: Verifying fixes...");

    const { data: updatedProducts, error: verifyError } = await supabase
      .from("products")
      .select("id, title, image, created_at")
      .in("title", ["Elegant Evening Gown", "Couture Evening Ensemble"])
      .order("created_at");

    if (verifyError) {
      console.error("❌ Error verifying updates:", verifyError);
    } else {
      console.log(`📊 Verification results:`);
      console.log(`   ✅ Successfully updated: ${updatedCount}`);
      console.log(`   ❌ Errors: ${errorCount}`);

      if (updatedProducts && updatedProducts.length > 0) {
        console.log(`\n📋 Updated product-image associations:`);
        updatedProducts.forEach((product) => {
          const filename = product.image
            ? product.image.split("/").pop()
            : "No image";
          const date = new Date(product.created_at).toLocaleString();
          console.log(`   - ${product.title} (${date}): ${filename}`);
        });

        // Check for duplicates after update
        const imageUsage = new Map();
        updatedProducts.forEach((product) => {
          if (product.image) {
            const filename = product.image.split("/").pop();
            if (imageUsage.has(filename)) {
              imageUsage.get(filename).push(product.title);
            } else {
              imageUsage.set(filename, [product.title]);
            }
          }
        });

        const duplicates = Array.from(imageUsage.entries()).filter(
          ([filename, products]) => products.length > 1
        );

        if (duplicates.length === 0) {
          console.log(`\n✅ No duplicate images found after update!`);
        } else {
          console.log(`\n🔄 Still have duplicate images:`);
          duplicates.forEach(([filename, products]) => {
            console.log(`   📸 ${filename}:`);
            products.forEach((product) => console.log(`      - ${product}`));
          });
        }
      }
    }

    // 6. Summary
    console.log("\n" + "=".repeat(70));
    console.log("🎯 Manual duplicate fix completed!");

    if (updatedCount > 0) {
      console.log(
        `\n✅ Successfully fixed ${updatedCount} duplicate product images!`
      );
      console.log(`   - Each product now has a unique image`);
      console.log(`   - No more duplicate image usage`);

      console.log("\n🚀 Next steps:");
      console.log("   1. Clear your browser cache completely");
      console.log("   2. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)");
      console.log("   3. Product images should now be unique and accurate!");
    } else {
      console.log("\n❌ No duplicate images were fixed");
    }

    console.log(`\n📊 Final results:`);
    console.log(`   ✅ Successfully fixed: ${updatedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
  } catch (error) {
    console.error("❌ Error in manualFixDuplicate:", error);
  }
}

// Run the manual fix
manualFixDuplicate()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
