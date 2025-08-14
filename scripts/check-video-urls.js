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

async function checkVideoUrls() {
  try {
    console.log("🎬 Checking video URLs in database...");

    // Check brands with videos
    console.log("\n🏷️ Checking brands with videos...");
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, video_url, video_thumbnail")
      .not("video_url", "is", null);

    if (brandsError) {
      console.log(`   ❌ Brands query error: ${brandsError.message}`);
    } else {
      console.log(`   ✅ Found ${brands.length} brands with videos`);
      brands.forEach((brand, index) => {
        console.log(`   ${index + 1}. ${brand.name}`);
        console.log(`      Video URL: ${brand.video_url}`);
        console.log(`      Thumbnail: ${brand.video_thumbnail || "None"}`);
      });
    }

    // Check products with videos
    console.log("\n📦 Checking products with videos...");
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, video_url, video_thumbnail")
      .not("video_url", "is", null);

    if (productsError) {
      console.log(`   ❌ Products query error: ${productsError.message}`);
    } else {
      console.log(`   ✅ Found ${products.length} products with videos`);
      products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.title}`);
        console.log(`      Video URL: ${product.video_url}`);
        console.log(`      Thumbnail: ${product.video_thumbnail || "None"}`);
      });
    }

    // Check spotlight content with videos
    console.log("\n⭐ Checking spotlight content with videos...");
    const { data: spotlight, error: spotlightError } = await supabase
      .from("spotlight_content")
      .select("id, title, video_url, video_thumbnail")
      .not("video_url", "is", null);

    if (spotlightError) {
      console.log(`   ❌ Spotlight query error: ${spotlightError.message}`);
    } else {
      console.log(
        `   ✅ Found ${spotlight.length} spotlight items with videos`
      );
      spotlight.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title}`);
        console.log(`      Video URL: ${item.video_url}`);
        console.log(`      Thumbnail: ${item.video_thumbnail || "None"}`);
      });
    }

    // Test a few video URLs if they exist
    const allVideos = [
      ...(brands || []).map((b) => ({
        type: "brand",
        name: b.name,
        url: b.video_url,
      })),
      ...(products || []).map((p) => ({
        type: "product",
        name: p.title,
        url: p.video_url,
      })),
      ...(spotlight || []).map((s) => ({
        type: "spotlight",
        name: s.title,
        url: s.video_url,
      })),
    ];

    if (allVideos.length > 0) {
      console.log("\n🧪 Testing video URL accessibility...");

      for (const video of allVideos.slice(0, 3)) {
        // Test first 3
        console.log(`\n🔍 Testing ${video.type}: ${video.name}`);
        console.log(`   URL: ${video.url}`);

        try {
          const response = await fetch(video.url);
          console.log(`   Status: ${response.status} ${response.statusText}`);

          if (response.ok) {
            const contentType = response.headers.get("content-type");
            const contentLength = response.headers.get("content-length");
            console.log(
              `   ✅ Success! Content-Type: ${contentType}, Size: ${contentLength} bytes`
            );
          } else {
            console.log(`   ❌ Failed to load video`);
          }
        } catch (fetchError) {
          console.log(`   ❌ Fetch error: ${fetchError.message}`);
        }
      }
    } else {
      console.log("\n⚠️ No videos found in database");
    }
  } catch (error) {
    console.error("❌ Error in checkVideoUrls:", error);
  }
}

// Run the check
checkVideoUrls()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
