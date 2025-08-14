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

async function checkServiceProducts() {
  try {
    console.log("🔍 Checking for service-type products...");

    // Get all products that might be services
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, brand_id, image, category, created_at")
      .order("title");

    if (productsError) {
      console.error("❌ Error fetching products:", productsError);
      return;
    }

    console.log(`📋 Found ${products.length} total products`);

    // Look for service-related categories or titles
    const serviceKeywords = [
      "service",
      "consultation",
      "alteration",
      "fitting",
      "custom",
      "tailoring",
      "repair",
    ];
    const serviceProducts = products.filter((product) => {
      const title = product.title?.toLowerCase() || "";
      const category = product.category?.toLowerCase() || "";
      return serviceKeywords.some(
        (keyword) => title.includes(keyword) || category.includes(keyword)
      );
    });

    console.log(`🔧 Found ${serviceProducts.length} service-type products`);

    // Get brand names for context
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    const brandMap = brands.reduce((acc, brand) => {
      acc[brand.id] = brand.name;
      return acc;
    }, {});

    // Analyze image patterns for service products
    let uniqueImageCount = 0;
    const uniqueImages = new Set();
    const imageServiceMap = {};

    serviceProducts.forEach((product) => {
      if (product.image) {
        uniqueImages.add(product.image);

        // Track which services use each image
        if (!imageServiceMap[product.image]) {
          imageServiceMap[product.image] = [];
        }
        imageServiceMap[product.image].push({
          id: product.id,
          title: product.title,
          brand: brandMap[product.brand_id] || "Unknown",
          category: product.category,
        });
      }
    });

    uniqueImageCount = uniqueImages.size;

    console.log(`\n📊 Service Image Analysis:`);
    console.log(`   🖼️ Unique images: ${uniqueImageCount}`);
    console.log(`   🔧 Total service products: ${serviceProducts.length}`);
    console.log(
      `   🔄 Duplicate images: ${serviceProducts.length - uniqueImageCount}`
    );

    // Show service products with duplicate images
    const duplicates = Object.entries(imageServiceMap).filter(
      ([image, serviceList]) => serviceList.length > 1
    );
    if (duplicates.length > 0) {
      console.log(`\n🔄 Service products with duplicate images:`);
      duplicates.forEach(([image, serviceList]) => {
        const filename = image.split("/").pop() || "";
        console.log(`\n   📸 Image: ${filename}`);
        console.log(`   🔗 URL: ${image}`);
        console.log(`   📋 Used by ${serviceList.length} services:`);
        serviceList.forEach((service) => {
          console.log(
            `      - ${service.title} (${service.brand}) - ${service.category}`
          );
        });
      });
    }

    // Show first few service products with their images
    console.log(`\n📋 Sample service products (first 10):`);
    serviceProducts.slice(0, 10).forEach((product) => {
      const brandName = brandMap[product.brand_id] || "Unknown";
      const filename = product.image
        ? product.image.split("/").pop()
        : "No image";
      console.log(
        `   - ${product.title} (${brandName}) [${product.category}]: ${filename}`
      );
    });

    console.log(`\n🎯 Service product check completed!`);
  } catch (error) {
    console.error("❌ Error in checkServiceProducts:", error);
  }
}

// Run the check
checkServiceProducts()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
