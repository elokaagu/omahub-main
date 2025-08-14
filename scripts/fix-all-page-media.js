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

async function fixAllPageMedia() {
  try {
    console.log("🔍 Fixing all page media (images and videos)...");

    // 1. Check Products
    console.log("\n📦 Step 1: Checking Products...");
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, image, video_url, video_thumbnail, brand_id");

    if (productsError) {
      console.error("❌ Error fetching products:", productsError);
    } else {
      console.log(`📋 Found ${products.length} products`);

      let productsWithImages = 0;
      let productsWithVideos = 0;
      let productsWithIssues = 0;

      for (const product of products) {
        if (product.image && !product.image.includes("placeholder")) {
          productsWithImages++;
        } else {
          productsWithIssues++;
          console.log(
            `   ⚠️ Product "${product.title}" has image issue: ${product.image || "No image"}`
          );
        }

        if (product.video_url) {
          productsWithVideos++;
        }
      }

      console.log(`   ✅ Products with images: ${productsWithImages}`);
      console.log(`   🎥 Products with videos: ${productsWithVideos}`);
      console.log(`   ⚠️ Products with issues: ${productsWithIssues}`);
    }

    // 2. Check Catalogues (Collections)
    console.log("\n🖼️ Step 2: Checking Catalogues...");
    const { data: catalogues, error: cataloguesError } = await supabase
      .from("catalogues")
      .select("id, title, image, brand_id");

    if (cataloguesError) {
      console.error("❌ Error fetching catalogues:", cataloguesError);
    } else {
      console.log(`📋 Found ${catalogues.length} catalogues`);

      let cataloguesWithImages = 0;
      let cataloguesWithIssues = 0;

      for (const catalogue of catalogues) {
        if (catalogue.image && !catalogue.image.includes("placeholder")) {
          cataloguesWithImages++;
        } else {
          cataloguesWithIssues++;
          console.log(
            `   ⚠️ Catalogue "${catalogue.title}" has image issue: ${catalogue.image || "No image"}`
          );
        }
      }

      console.log(`   ✅ Catalogues with images: ${cataloguesWithImages}`);
      console.log(`   ⚠️ Catalogues with issues: ${cataloguesWithIssues}`);
    }

    // 3. Check Reviews
    console.log("\n⭐ Step 3: Checking Reviews...");
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("id, author, comment, rating, brand_id, created_at");

    if (reviewsError) {
      console.error("❌ Error fetching reviews:", reviewsError);
    } else {
      console.log(`📋 Found ${reviews.length} reviews`);
      console.log(`   ✅ Reviews don't have media (text only)`);
    }

    // 4. Check if there are any other media-related issues
    console.log("\n🔍 Step 4: Checking for other media issues...");

    // Check if there are any products with broken image URLs
    if (products && products.length > 0) {
      console.log("\n🔧 Checking product image URLs...");

      let brokenImageCount = 0;
      let workingImageCount = 0;

      for (const product of products.slice(0, 10)) {
        // Check first 10 products
        if (product.image) {
          try {
            const response = await fetch(product.image);
            if (response.ok) {
              workingImageCount++;
            } else {
              brokenImageCount++;
              console.log(
                `   ❌ Broken image URL for "${product.title}": ${product.image}`
              );
            }
          } catch (e) {
            brokenImageCount++;
            console.log(
              `   ❌ Error checking image for "${product.title}": ${e.message}`
            );
          }
        }
      }

      console.log(`   ✅ Working images: ${workingImageCount}`);
      console.log(`   ❌ Broken images: ${brokenImageCount}`);
    }

    // 5. Check video URLs
    if (products && products.length > 0) {
      console.log("\n🎥 Checking product video URLs...");

      let workingVideoCount = 0;
      let brokenVideoCount = 0;

      for (const product of products) {
        if (product.video_url) {
          try {
            const response = await fetch(product.video_url);
            if (response.ok) {
              workingVideoCount++;
            } else {
              brokenVideoCount++;
              console.log(
                `   ❌ Broken video URL for "${product.title}": ${product.video_url}`
              );
            }
          } catch (e) {
            brokenVideoCount++;
            console.log(
              `   ❌ Error checking video for "${product.title}": ${e.message}`
            );
          }
        }
      }

      console.log(`   ✅ Working videos: ${workingVideoCount}`);
      console.log(`   ❌ Broken videos: ${brokenVideoCount}`);
    }

    // 6. Summary and recommendations
    console.log("\n📊 Media Status Summary:");
    console.log(`   📦 Products: ${products ? products.length : 0} total`);
    console.log(
      `   🖼️ Catalogues: ${catalogues ? catalogues.length : 0} total`
    );
    console.log(`   ⭐ Reviews: ${reviews ? reviews.length : 0} total`);

    if (products) {
      const productsWithRealImages = products.filter(
        (p) => p.image && !p.image.includes("placeholder")
      );
      const productsWithVideos = products.filter((p) => p.video_url);

      console.log(
        `   ✅ Products with real images: ${productsWithRealImages.length}`
      );
      console.log(`   🎥 Products with videos: ${productsWithVideos.length}`);
    }

    if (catalogues) {
      const cataloguesWithRealImages = catalogues.filter(
        (c) => c.image && !c.image.includes("placeholder")
      );
      console.log(
        `   ✅ Catalogues with real images: ${cataloguesWithRealImages.length}`
      );
    }

    console.log("\n🎯 All page media check completed!");
  } catch (error) {
    console.error("❌ Error in fixAllPageMedia:", error);
  }
}

// Run the check
fixAllPageMedia()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
