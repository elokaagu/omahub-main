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

async function checkServiceImages() {
  try {
    console.log("🔍 Checking service image accuracy...");

    // Get all services with their current images
    const { data: services, error: servicesError } = await supabase
      .from("tailoring_services")
      .select("id, title, brand_id, image, created_at")
      .order("title");

    if (servicesError) {
      console.error("❌ Error fetching services:", servicesError);
      return;
    }

    console.log(`📋 Found ${services.length} services`);

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

    // Analyze image patterns
    let uniqueImageCount = 0;
    const uniqueImages = new Set();
    const imageServiceMap = {};

    services.forEach((service) => {
      if (service.image) {
        uniqueImages.add(service.image);

        // Track which services use each image
        if (!imageServiceMap[service.image]) {
          imageServiceMap[service.image] = [];
        }
        imageServiceMap[service.image].push({
          id: service.id,
          title: service.title,
          brand: brandMap[service.brand_id] || "Unknown",
        });
      }
    });

    uniqueImageCount = uniqueImages.size;

    console.log(`\n📊 Image Analysis:`);
    console.log(`   🖼️ Unique images: ${uniqueImageCount}`);
    console.log(`   🔧 Total services: ${services.length}`);
    console.log(
      `   🔄 Duplicate images: ${services.length - uniqueImageCount}`
    );

    // Show services with duplicate images
    const duplicates = Object.entries(imageServiceMap).filter(
      ([image, serviceList]) => serviceList.length > 1
    );
    if (duplicates.length > 0) {
      console.log(`\n🔄 Services with duplicate images:`);
      duplicates.forEach(([image, serviceList]) => {
        const filename = image.split("/").pop() || "";
        console.log(`\n   📸 Image: ${filename}`);
        console.log(`   🔗 URL: ${image}`);
        console.log(`   📋 Used by ${serviceList.length} services:`);
        serviceList.forEach((service) => {
          console.log(`      - ${service.title} (${service.brand})`);
        });
      });
    }

    // Show first few services with their images
    console.log(`\n📋 Sample service images (first 10):`);
    services.slice(0, 10).forEach((service) => {
      const brandName = brandMap[service.brand_id] || "Unknown";
      const filename = service.image
        ? service.image.split("/").pop()
        : "No image";
      console.log(`   - ${service.title} (${brandName}): ${filename}`);
    });

    console.log(`\n🎯 Service image check completed!`);
  } catch (error) {
    console.error("❌ Error in checkServiceImages:", error);
  }
}

// Run the check
checkServiceImages()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
