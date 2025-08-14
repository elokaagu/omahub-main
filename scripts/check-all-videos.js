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

async function checkAllVideos() {
  try {
    console.log("🎥 Checking ALL videos across the entire database...");

    // 1. Check Products for videos
    console.log("\n📦 Step 1: Checking Products for videos...");
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(
        "id, title, video_url, video_thumbnail, video_type, video_description"
      );

    if (productsError) {
      console.error("❌ Error fetching products:", productsError);
    } else {
      console.log(`📋 Found ${products.length} products`);

      let productsWithVideos = 0;
      let productsWithVideoThumbnails = 0;

      for (const product of products) {
        if (product.video_url) {
          productsWithVideos++;
          console.log(
            `   🎥 Product "${product.title}" has video: ${product.video_url}`
          );
          if (product.video_thumbnail) {
            productsWithVideoThumbnails++;
            console.log(`      📸 Thumbnail: ${product.video_thumbnail}`);
          }
          if (product.video_type) {
            console.log(`      🏷️ Type: ${product.video_type}`);
          }
          if (product.video_description) {
            console.log(`      📝 Description: ${product.video_description}`);
          }
        }
      }

      console.log(`   ✅ Products with videos: ${productsWithVideos}`);
      console.log(
        `   📸 Products with video thumbnails: ${productsWithVideoThumbnails}`
      );
    }

    // 2. Check Brands for videos
    console.log("\n🏷️ Step 2: Checking Brands for videos...");
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, video_url, video_thumbnail");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
    } else {
      console.log(`📋 Found ${brands.length} brands`);

      let brandsWithVideos = 0;
      let brandsWithVideoThumbnails = 0;

      for (const brand of brands) {
        if (brand.video_url) {
          brandsWithVideos++;
          console.log(
            `   🎥 Brand "${brand.name}" has video: ${brand.video_url}`
          );
          if (brand.video_thumbnail) {
            brandsWithVideoThumbnails++;
            console.log(`      📸 Thumbnail: ${brand.video_thumbnail}`);
          }
        }
      }

      console.log(`   ✅ Brands with videos: ${brandsWithVideos}`);
      console.log(
        `   📸 Brands with video thumbnails: ${brandsWithVideoThumbnails}`
      );
    }

    // 3. Check Catalogues for videos
    console.log("\n🖼️ Step 3: Checking Catalogues for videos...");
    const { data: catalogues, error: cataloguesError } = await supabase
      .from("catalogues")
      .select("id, title, video_url, video_thumbnail");

    if (cataloguesError) {
      console.error("❌ Error fetching catalogues:", cataloguesError);
    } else {
      console.log(`📋 Found ${catalogues.length} catalogues`);

      let cataloguesWithVideos = 0;
      let cataloguesWithVideoThumbnails = 0;

      for (const catalogue of catalogues) {
        if (catalogue.video_url) {
          cataloguesWithVideos++;
          console.log(
            `   🎥 Catalogue "${catalogue.title}" has video: ${catalogue.video_url}`
          );
          if (catalogue.video_thumbnail) {
            cataloguesWithVideoThumbnails++;
            console.log(`      📸 Thumbnail: ${catalogue.video_thumbnail}`);
          }
        }
      }

      console.log(`   ✅ Catalogues with videos: ${cataloguesWithVideos}`);
      console.log(
        `   📸 Catalogues with video thumbnails: ${cataloguesWithVideoThumbnails}`
      );
    }

    // 4. Check Storage buckets for video files
    console.log("\n📦 Step 4: Checking Storage buckets for video files...");

    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error("❌ Error listing buckets:", bucketsError);
    } else {
      console.log(`📋 Found ${buckets.length} storage buckets`);

      for (const bucket of buckets) {
        console.log(`\n🔍 Searching bucket: ${bucket.name}`);

        try {
          const { data: files, error: listError } = await supabase.storage
            .from(bucket.name)
            .list("", { limit: 1000 });

          if (listError) {
            console.log(`   ❌ Error listing files: ${listError.message}`);
          } else {
            // Look for video files
            const videoFiles = files.filter(
              (file) =>
                file.name.match(
                  /\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v|3gp|ogv)$/i
                ) ||
                file.name.includes("video") ||
                file.name.includes("brands") // Check brands folder
            );

            if (videoFiles.length > 0) {
              console.log(
                `   🎥 Found ${videoFiles.length} video files in ${bucket.name}:`
              );
              videoFiles.forEach((file) => {
                console.log(
                  `      - ${file.name} (${file.metadata?.size || "unknown size"} bytes)`
                );
              });
            } else {
              console.log(`   📁 No video files found in ${bucket.name}`);
            }
          }
        } catch (bucketError) {
          console.log(`   ❌ Error accessing bucket: ${bucketError.message}`);
        }
      }
    }

    // 5. Check for any other tables that might have videos
    console.log("\n🔍 Step 5: Checking for other video-related tables...");

    const otherTableNames = ["spotlight", "hero", "portfolio", "services"];

    for (const tableName of otherTableNames) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("id, name, title, video_url, video_thumbnail")
          .limit(1);

        if (!error) {
          console.log(`✅ Table "${tableName}" exists`);

          // Get all records from this table
          const { data: allData, error: allError } = await supabase
            .from(tableName)
            .select("id, name, title, video_url, video_thumbnail");

          if (!allError && allData) {
            const itemsWithVideos = allData.filter((item) => item.video_url);
            if (itemsWithVideos.length > 0) {
              console.log(
                `   🎥 Found ${itemsWithVideos.length} items with videos in ${tableName}`
              );
              itemsWithVideos.forEach((item) => {
                const name = item.name || item.title || `ID: ${item.id}`;
                console.log(`      - ${name}: ${item.video_url}`);
              });
            }
          }
        } else {
          console.log(`❌ Table "${tableName}" doesn't exist`);
        }
      } catch (e) {
        console.log(`❌ Error checking table "${tableName}": ${e.message}`);
      }
    }

    // 6. Summary
    console.log("\n📊 Video Summary:");
    console.log(
      `   📦 Products with videos: ${products ? products.filter((p) => p.video_url).length : 0}`
    );
    console.log(
      `   🏷️ Brands with videos: ${brands ? brands.filter((b) => b.video_url).length : 0}`
    );
    console.log(
      `   🖼️ Catalogues with videos: ${catalogues ? catalogues.filter((c) => c.video_url).length : 0}`
    );

    console.log("\n🎯 All video check completed!");
  } catch (error) {
    console.error("❌ Error in checkAllVideos:", error);
  }
}

// Run the check
checkAllVideos()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
