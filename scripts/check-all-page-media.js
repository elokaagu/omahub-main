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

async function checkAllPageMedia() {
  try {
    console.log("🔍 Checking all page media (images and videos)...");

    // 1. Check Products
    console.log("\n📦 Step 1: Checking Products...");
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, image, video_url, brand_id");

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
            `   ⚠️ Product "${product.name}" has image issue: ${product.image || "No image"}`
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

    // 2. Check Collections
    console.log("\n🖼️ Step 2: Checking Collections...");
    const { data: collections, error: collectionsError } = await supabase
      .from("collections")
      .select("id, name, image, video_url");

    if (collectionsError) {
      console.error("❌ Error fetching collections:", collectionsError);
    } else {
      console.log(`📋 Found ${collections.length} collections`);

      let collectionsWithImages = 0;
      let collectionsWithVideos = 0;
      let collectionsWithIssues = 0;

      for (const collection of collections) {
        if (collection.image && !collection.image.includes("placeholder")) {
          collectionsWithImages++;
        } else {
          collectionsWithIssues++;
          console.log(
            `   ⚠️ Collection "${collection.name}" has image issue: ${collection.image || "No image"}`
          );
        }

        if (collection.video_url) {
          collectionsWithVideos++;
        }
      }

      console.log(`   ✅ Collections with images: ${collectionsWithImages}`);
      console.log(`   🎥 Collections with videos: ${collectionsWithVideos}`);
      console.log(`   ⚠️ Collections with issues: ${collectionsWithIssues}`);
    }

    // 3. Check Services (Tailoring)
    console.log("\n✂️ Step 3: Checking Services (Tailoring)...");
    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("id, name, image, video_url");

    if (servicesError) {
      console.error("❌ Error fetching services:", servicesError);
    } else {
      console.log(`📋 Found ${services.length} services`);

      let servicesWithImages = 0;
      let servicesWithVideos = 0;
      let servicesWithIssues = 0;

      for (const service of services) {
        if (service.image && !service.image.includes("placeholder")) {
          servicesWithImages++;
        } else {
          servicesWithIssues++;
          console.log(
            `   ⚠️ Service "${service.name}" has image issue: ${service.image || "No image"}`
          );
        }

        if (service.video_url) {
          servicesWithVideos++;
        }
      }

      console.log(`   ✅ Services with images: ${servicesWithImages}`);
      console.log(`   🎥 Services with videos: ${servicesWithVideos}`);
      console.log(`   ⚠️ Services with issues: ${servicesWithIssues}`);
    }

    // 4. Check Portfolio
    console.log("\n🎨 Step 4: Checking Portfolio...");
    const { data: portfolio, error: portfolioError } = await supabase
      .from("portfolio")
      .select("id, name, image, video_url");

    if (portfolioError) {
      console.error("❌ Error fetching portfolio:", portfolioError);
    } else {
      console.log(`📋 Found ${portfolio.length} portfolio items`);

      let portfolioWithImages = 0;
      let portfolioWithVideos = 0;
      let portfolioWithIssues = 0;

      for (const item of portfolio) {
        if (item.image && !item.image.includes("placeholder")) {
          portfolioWithImages++;
        } else {
          portfolioWithIssues++;
          console.log(
            `   ⚠️ Portfolio "${item.name}" has image issue: ${item.image || "No image"}`
          );
        }

        if (item.video_url) {
          portfolioWithVideos++;
        }
      }

      console.log(`   ✅ Portfolio with images: ${portfolioWithImages}`);
      console.log(`   🎥 Portfolio with videos: ${portfolioWithVideos}`);
      console.log(`   ⚠️ Portfolio with issues: ${portfolioWithIssues}`);
    }

    // 5. Check Spotlight
    console.log("\n⭐ Step 5: Checking Spotlight...");
    const { data: spotlight, error: spotlightError } = await supabase
      .from("spotlight")
      .select("id, name, image, video_url");

    if (spotlightError) {
      console.error("❌ Error fetching spotlight:", spotlightError);
    } else {
      console.log(`📋 Found ${spotlight.length} spotlight items`);

      let spotlightWithImages = 0;
      let spotlightWithVideos = 0;
      let spotlightWithIssues = 0;

      for (const item of spotlight) {
        if (item.image && !item.image.includes("placeholder")) {
          spotlightWithImages++;
        } else {
          spotlightWithIssues++;
          console.log(
            `   ⚠️ Spotlight "${item.name}" has image issue: ${item.image || "No image"}`
          );
        }

        if (item.video_url) {
          spotlightWithVideos++;
        }
      }

      console.log(`   ✅ Spotlight with images: ${spotlightWithImages}`);
      console.log(`   🎥 Spotlight with videos: ${spotlightWithVideos}`);
      console.log(`   ⚠️ Spotlight with issues: ${spotlightWithIssues}`);
    }

    // 6. Check Hero Images
    console.log("\n🖼️ Step 6: Checking Hero Images...");
    const { data: hero, error: heroError } = await supabase
      .from("hero")
      .select("id, name, image, video_url");

    if (heroError) {
      console.error("❌ Error fetching hero:", heroError);
    } else {
      console.log(`📋 Found ${hero.length} hero items`);

      let heroWithImages = 0;
      let heroWithVideos = 0;
      let heroWithIssues = 0;

      for (const item of hero) {
        if (item.image && !item.image.includes("placeholder")) {
          heroWithImages++;
        } else {
          heroWithIssues++;
          console.log(
            `   ⚠️ Hero "${item.name}" has image issue: ${item.image || "No image"}`
          );
        }

        if (item.video_url) {
          heroWithVideos++;
        }
      }

      console.log(`   ✅ Hero with images: ${heroWithImages}`);
      console.log(`   🎥 Hero with videos: ${heroWithVideos}`);
      console.log(`   ⚠️ Hero with issues: ${heroWithIssues}`);
    }

    console.log("\n🎯 All page media check completed!");
  } catch (error) {
    console.error("❌ Error in checkAllPageMedia:", error);
  }
}

// Run the check
checkAllPageMedia()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
