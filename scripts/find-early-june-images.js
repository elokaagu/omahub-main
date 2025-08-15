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

async function findEarlyJuneImages() {
  try {
    console.log("🔍 Finding early June product images...");
    console.log("=".repeat(70));
    console.log(
      "Looking for images that might be better matches for June 4th products"
    );
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

    console.log(`📋 Found ${products.length} problematic products:`);
    products.forEach((product) => {
      const date = new Date(product.created_at).toLocaleString();
      const filename = product.image
        ? product.image.split("/").pop()
        : "No image";
      console.log(`   - ${product.title}: Created ${date}, Image: ${filename}`);
    });

    // 2. Get all product images
    console.log("\n🖼️ Step 2: Getting all product images...");

    const { data: productImages, error: productImagesError } =
      await supabase.storage.from("product-images").list("", { limit: 1000 });

    if (productImagesError) {
      console.error("❌ Error listing product-images:", productImagesError);
      return;
    }

    const imageFiles = productImages.filter((file) =>
      file.name.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)
    );

    console.log(`🖼️ Found ${imageFiles.length} total product images`);

    // 3. Look for images in different date ranges
    console.log("\n🔍 Step 3: Analyzing images by date ranges...");

    // Sort images by creation time
    const sortedImages = imageFiles.sort((a, b) => {
      const aTime = new Date(a.created_at || a.updated_at || 0).getTime();
      const bTime = new Date(b.created_at || b.updated_at || 0).getTime();
      return aTime - bTime; // Oldest first
    });

    // Look for images in different time periods
    const targetDate = new Date("2025-06-04").getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const threeDayMs = 3 * oneDayMs;

    const earlyJuneImages = sortedImages.filter((img) => {
      const imgDate = new Date(img.created_at || img.updated_at || 0).getTime();
      return Math.abs(imgDate - targetDate) <= oneDayMs;
    });

    const earlyJunePlus3 = sortedImages.filter((img) => {
      const imgDate = new Date(img.created_at || img.updated_at || 0).getTime();
      return Math.abs(imgDate - targetDate) <= threeDayMs;
    });

    const june10Images = sortedImages.filter((img) => {
      const imgDate = new Date(img.created_at || img.updated_at || 0).getTime();
      const june10 = new Date("2025-06-10").getTime();
      return Math.abs(imgDate - june10) <= oneDayMs;
    });

    console.log(`\n📊 Image distribution by date:`);
    console.log(`   📅 June 4-5 (±1 day): ${earlyJuneImages.length} images`);
    console.log(`   📅 June 4-7 (±3 days): ${earlyJunePlus3.length} images`);
    console.log(`   📅 June 10 (±1 day): ${june10Images.length} images`);

    // 4. Show images from different periods
    if (earlyJuneImages.length > 0) {
      console.log(
        `\n📸 Images from June 4-5 (${earlyJuneImages.length} found):`
      );
      earlyJuneImages.slice(0, 10).forEach((image, index) => {
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

    if (june10Images.length > 0) {
      console.log(`\n📸 Images from June 10 (${june10Images.length} found):`);
      june10Images.slice(0, 15).forEach((image, index) => {
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

    // 5. Look for larger, more detailed images that might be better
    console.log(`\n🔍 Step 4: Looking for high-quality alternatives...`);

    const largeImages = sortedImages.filter(
      (img) => (img.metadata?.size || 0) > 1000000 // Images larger than 1MB
    );

    console.log(`📸 Large images (>1MB) that might be better quality:`);
    largeImages.slice(0, 10).forEach((image, index) => {
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

    // 6. Recommendations
    console.log("\n💡 Step 5: Recommendations...");

    if (earlyJuneImages.length >= 2) {
      console.log("✅ Found enough early June images!");
      console.log("   We can assign these to the problematic products");
    } else if (largeImages.length >= 2) {
      console.log("✅ Found enough large, high-quality images!");
      console.log("   We can assign these as alternatives");
    } else {
      console.log("⚠️  Limited options available");
      console.log("   The current assignments might be the best available");
    }

    console.log("\n🚀 Next steps:");
    console.log("   1. Review the available images above");
    console.log("   2. Choose the best alternatives for each product");
    console.log("   3. Update the product assignments manually if needed");
  } catch (error) {
    console.error("❌ Error in findEarlyJuneImages:", error);
  }
}

// Run the search
findEarlyJuneImages()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
