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

async function manualBrandImageMapping() {
  try {
    console.log("🎯 Manual Brand-Image Mapping Tool");
    console.log("=".repeat(70));
    console.log(
      "This tool will help you manually assign the correct images to each brand"
    );
    console.log(
      "based on your original setup, rather than chronological matching."
    );
    console.log("");

    // 1. Get all brands
    console.log("🏷️ Step 1: Getting all brands...");

    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image, created_at")
      .order("name");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    console.log(`📋 Found ${brands.length} brands`);

    // 2. Get all available images from brand-assets bucket
    console.log(
      "\n📦 Step 2: Getting all available images from brand-assets bucket..."
    );

    const { data: brandAssets, error: brandAssetsError } =
      await supabase.storage.from("brand-assets").list("", { limit: 1000 });

    if (brandAssetsError) {
      console.error("❌ Error listing brand-assets:", brandAssetsError);
      return;
    }

    const imageFiles = brandAssets.filter((file) =>
      file.name.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)
    );

    console.log(`🖼️ Found ${imageFiles.length} images in brand-assets bucket`);

    // 3. Display current assignments
    console.log("\n📊 Step 3: Current brand-image assignments:");
    console.log("(These are the current assignments that might be incorrect)");

    brands.forEach((brand, index) => {
      const currentImage = brand.image
        ? brand.image.split("/").pop()
        : "No image";
      console.log(`   ${index + 1}. ${brand.name} → ${currentImage}`);
    });

    // 4. Display all available images
    console.log("\n🖼️ Step 4: All available images in brand-assets bucket:");
    console.log("(These are the images you can choose from)");

    imageFiles.forEach((file, index) => {
      const size = file.metadata?.size
        ? `${Math.round(file.metadata.size / 1024)}KB`
        : "unknown";
      console.log(`   ${index + 1}. ${file.name} (${size})`);
    });

    // 5. Instructions for manual mapping
    console.log("\n" + "=".repeat(70));
    console.log("🎯 MANUAL MAPPING INSTRUCTIONS:");
    console.log("");
    console.log("To fix the brand-image mappings, you need to:");
    console.log("");
    console.log("1. 📝 Create a mapping file:");
    console.log("   - Create a file called 'brand-image-mapping.json'");
    console.log("   - Map each brand name to its correct image filename");
    console.log("");
    console.log("2. 🔧 Example mapping format:");
    console.log("   {");
    console.log('     "54 Stitches": "2a14c31f_1751808104675.png",');
    console.log('     "ANDREA IYAMAH": "2a14c31f_1755113065859.jpg",');
    console.log('     "Adesilver Spitalfields": "2a14c31f_1754978551490.jpg"');
    console.log("   }");
    console.log("");
    console.log("3. 🚀 Run the update script:");
    console.log("   - Use the 'update-brand-images-from-mapping.js' script");
    console.log("   - It will read your mapping file and update the database");
    console.log("");

    // 6. Show sample of what needs to be mapped
    console.log("📋 SAMPLE MAPPING NEEDED:");
    console.log("(You need to decide which image goes with which brand)");

    console.log("\n🏷️ Brands (first 10):");
    brands.slice(0, 10).forEach((brand, index) => {
      console.log(`   ${index + 1}. ${brand.name}`);
    });

    console.log("\n🖼️ Available Images (first 10):");
    imageFiles.slice(0, 10).forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.name}`);
    });

    console.log(
      "\n💡 TIP: Look at the actual images in the Supabase storage interface"
    );
    console.log("   to see which image should go with which brand!");

    // 7. Create a template mapping file
    console.log("\n📝 Step 5: Creating template mapping file...");

    const templateMapping = {};
    brands.forEach((brand) => {
      // For now, keep the current image as a placeholder
      const currentImage = brand.image
        ? brand.image.split("/").pop()
        : "NO_IMAGE";
      templateMapping[brand.name] = currentImage;
    });

    const fs = require("fs");
    const templatePath = "brand-image-mapping-template.json";

    fs.writeFileSync(templatePath, JSON.stringify(templateMapping, null, 2));
    console.log(`✅ Created template file: ${templatePath}`);
    console.log(
      "   - Edit this file to specify the correct image for each brand"
    );
    console.log("   - Replace the placeholder images with the correct ones");
    console.log("   - Save it as 'brand-image-mapping.json' when done");

    console.log("\n" + "=".repeat(70));
    console.log("🎯 Manual mapping setup completed!");

    console.log("\n🚀 Next steps:");
    console.log(
      "   1. Edit the template file with correct brand-image mappings"
    );
    console.log("   2. Save it as 'brand-image-mapping.json'");
    console.log("   3. Run the update script to apply your mappings");
    console.log("   4. Test the homepage to verify correct images");
  } catch (error) {
    console.error("❌ Error in manualBrandImageMapping:", error);
  }
}

// Run the manual mapping setup
manualBrandImageMapping()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
