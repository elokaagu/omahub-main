const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBrandImageStorage() {
  try {
    console.log(
      "🔍 Checking where brand images are stored in the database and storage...\n"
    );

    // 1. Check the brands table structure
    console.log("📊 Checking brands table structure...");

    const { data: sampleBrand, error: brandError } = await supabase
      .from("brands")
      .select("*")
      .limit(1);

    if (brandError) {
      console.error("❌ Error fetching sample brand:", brandError);
      return;
    }

    if (sampleBrand && sampleBrand.length > 0) {
      const brand = sampleBrand[0];
      console.log("📋 Brands table columns:");
      Object.keys(brand).forEach((key) => {
        if (key.toLowerCase().includes("image")) {
          console.log(`  - ${key}: ${brand[key]}`);
        }
      });
    }

    // 2. Check the brand_images table structure
    console.log("\n📊 Checking brand_images table structure...");

    const { data: sampleBrandImage, error: brandImageError } = await supabase
      .from("brand_images")
      .select("*")
      .limit(1);

    if (brandImageError) {
      console.error("❌ Error fetching sample brand_image:", brandImageError);
    } else if (sampleBrandImage && sampleBrandImage.length > 0) {
      const brandImage = sampleBrandImage[0];
      console.log("📋 brand_images table columns:");
      Object.keys(brandImage).forEach((key) => {
        console.log(`  - ${key}: ${brandImage[key]}`);
      });
    }

    // 3. Show sample data from both tables
    console.log("\n📊 Sample data from brands table:");

    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image")
      .limit(5);

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
    } else {
      brands.forEach((brand) => {
        console.log(`  - ${brand.name}:`);
        console.log(`    ID: ${brand.id}`);
        console.log(`    Image: ${brand.image}`);
      });
    }

    console.log("\n📊 Sample data from brand_images table:");

    const { data: brandImages, error: brandImagesError } = await supabase
      .from("brand_images")
      .select("id, brand_id, role, storage_path")
      .limit(5);

    if (brandImagesError) {
      console.error("❌ Error fetching brand_images:", brandImagesError);
    } else {
      brandImages.forEach((img) => {
        console.log(`  - Brand ID: ${img.brand_id}`);
        console.log(`    Role: ${img.role}`);
        console.log(`    Storage Path: ${img.storage_path}`);
        console.log(
          `    Full URL: ${supabaseUrl}/storage/v1/object/public/brand-assets/${img.storage_path}`
        );
      });
    }

    // 4. Check storage bucket structure
    console.log("\n📁 Checking storage bucket structure...");

    const { data: storageFiles, error: storageError } = await supabase.storage
      .from("brand-assets")
      .list("", { limit: 20 });

    if (storageError) {
      console.error("❌ Error listing storage:", storageError);
    } else {
      console.log(
        `✅ Found ${storageFiles.length} items in brand-assets bucket`
      );

      // Group by directory
      const directories = {};
      storageFiles.forEach((file) => {
        if (file.name.includes("/")) {
          const dir = file.name.split("/")[0];
          if (!directories[dir]) directories[dir] = [];
          directories[dir].push(file.name);
        } else {
          if (!directories["root"]) directories["root"] = [];
          directories["root"].push(file.name);
        }
      });

      console.log("\n📂 Storage directory structure:");
      Object.keys(directories).forEach((dir) => {
        console.log(`  ${dir}/: ${directories[dir].length} files`);
        if (directories[dir].length <= 3) {
          directories[dir].forEach((file) => {
            console.log(`    - ${file}`);
          });
        } else {
          directories[dir].slice(0, 3).forEach((file) => {
            console.log(`    - ${file}`);
          });
          console.log(`    ... and ${directories[dir].length - 3} more`);
        }
      });
    }

    // 5. Summary of where images are stored
    console.log(
      "\n💡 SUMMARY: Where brand images are stored when uploaded in Studio"
    );
    console.log("=".repeat(80));

    console.log("\n🗄️  DATABASE STORAGE:");
    console.log("  1. brands.image field:");
    console.log("     - Stores the full URL to the image");
    console.log(
      "     - Format: https://.../storage/v1/object/public/brand-assets/path/to/image.jpg"
    );
    console.log("     - Used for backward compatibility");

    console.log("\n  2. brand_images table:");
    console.log("     - id: UUID primary key");
    console.log("     - brand_id: References brands.id");
    console.log("     - role: Image role (cover, logo, gallery, etc.)");
    console.log("     - storage_path: Relative path in storage bucket");
    console.log("     - created_at: Upload timestamp");
    console.log("     - updated_at: Last update timestamp");

    console.log("\n📁 STORAGE BUCKET:");
    console.log("  - Bucket name: brand-assets");
    console.log(
      "  - File naming convention: {brandId}/{brandId}_{role}_{timestamp}.{extension}"
    );
    console.log("  - Example: 54-stitches/54-stitches_cover_1750014181103.jpg");

    console.log("\n🔄 UPLOAD FLOW:");
    console.log("  1. User selects image in Studio");
    console.log(
      "  2. Image uploaded to brand-assets bucket with structured naming"
    );
    console.log("  3. Entry created in brand_images table");
    console.log("  4. brands.image field updated with full URL");
    console.log("  5. Image now accessible via both storage paths");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

checkBrandImageStorage();
