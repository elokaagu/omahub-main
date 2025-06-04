const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findEhbsImages() {
  try {
    console.log("🔍 Finding all available images for Ehbs Couture...");

    // 1. Check brand image
    console.log("\n1️⃣ Checking brand image...");
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("*")
      .eq("id", "ehbs-couture")
      .single();

    if (brandError) {
      console.error("❌ Brand error:", brandError);
      return;
    }

    console.log("✅ Brand found:", brand.name);
    console.log("🖼️ Brand image:", brand.image);

    // 2. Check collection images
    console.log("\n2️⃣ Checking collection images...");
    const { data: collections, error: collectionsError } = await supabase
      .from("collections")
      .select("*")
      .eq("brand_id", "ehbs-couture");

    if (collectionsError) {
      console.error("❌ Collections error:", collectionsError);
    } else {
      console.log(`✅ Collections found: ${collections.length}`);
      collections.forEach((collection, index) => {
        console.log(`   ${index + 1}. ${collection.title}`);
        console.log(`      Image: ${collection.image}`);
      });
    }

    // 3. Check product images
    console.log("\n3️⃣ Checking product images...");
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("brand_id", "ehbs-couture");

    if (productsError) {
      console.error("❌ Products error:", productsError);
    } else {
      console.log(`✅ Products found: ${products.length}`);
      products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.title}`);
        console.log(`      Main image: ${product.image}`);
        if (product.images && product.images.length > 0) {
          console.log(`      Gallery images: ${product.images.length}`);
          product.images.forEach((img, imgIndex) => {
            console.log(`         ${imgIndex + 1}. ${img}`);
          });
        }
      });
    }

    // 4. List all available storage files in brand-assets
    console.log("\n4️⃣ Checking brand-assets storage...");
    try {
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from("brand-assets")
        .list("", {
          limit: 100,
          offset: 0,
        });

      if (storageError) {
        console.log("⚠️ Storage error:", storageError.message);
      } else {
        console.log(`📁 Storage folders found: ${storageFiles.length}`);

        // Check each folder
        for (const folder of storageFiles) {
          if (folder.name) {
            console.log(`\n📂 Checking folder: ${folder.name}`);
            const { data: folderFiles, error: folderError } =
              await supabase.storage.from("brand-assets").list(folder.name, {
                limit: 100,
                offset: 0,
              });

            if (folderError) {
              console.log(`   ⚠️ Error reading folder: ${folderError.message}`);
            } else {
              console.log(
                `   📄 Files in ${folder.name}: ${folderFiles.length}`
              );
              folderFiles.forEach((file, index) => {
                if (
                  file.name &&
                  !file.name.includes(".emptyFolderPlaceholder")
                ) {
                  const fullUrl = `${supabaseUrl}/storage/v1/object/public/brand-assets/${folder.name}/${file.name}`;
                  console.log(`      ${index + 1}. ${file.name}`);
                  console.log(`         URL: ${fullUrl}`);
                }
              });
            }
          }
        }
      }
    } catch (storageErr) {
      console.log("⚠️ Storage access error:", storageErr.message);
    }

    // 5. Compile all unique images
    console.log("\n5️⃣ Compiling all available images...");
    const allImages = new Set();

    if (brand.image) allImages.add(brand.image);

    collections.forEach((collection) => {
      if (collection.image) allImages.add(collection.image);
    });

    products.forEach((product) => {
      if (product.image) allImages.add(product.image);
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach((img) => allImages.add(img));
      }
    });

    console.log("🎨 All unique images for Ehbs Couture:");
    Array.from(allImages).forEach((image, index) => {
      console.log(`${index + 1}. ${image}`);
    });

    console.log(`\n📊 Total unique images: ${allImages.size}`);
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

findEhbsImages();
