const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateEhbsProductsWithStorageImages() {
  try {
    console.log("🎨 Updating Ehbs Couture products with storage images...");

    const collectionId = "c7d7aef3-73ce-40f0-b84d-89cd15a4179f";
    const brandId = "ehbs-couture";

    // Available images from storage and collection
    const availableImages = [
      // Brand image
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/brands/98l8xn8xcpi_1748789357220.jpg",
      // Collection image (current)
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/collections/wktqcn3zb5_1748805951528.png",
      // Other collection images from storage
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/collections/vq5uh8faje8_1748789795131.png",
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/collections/ygi6c1nrhfe_1748797926376.png",
      // Other brand images from storage
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/brands/2te7usrxhul_1748368664929.jpeg",
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/brands/dwliuy2y9lh_1748368219539.jpeg",
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/brands/ioq3slxyv4p_1748383737574.webp",
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/brands/om3cjv9cn2c_1748787827260.png",
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/brands/su5qsuv6bl_1748788317778.jpg",
    ];

    // Get current products
    console.log("\n🔍 Getting current products...");
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("brand_id", brandId)
      .eq("collection_id", collectionId)
      .order("created_at");

    if (productsError) {
      console.error("❌ Error fetching products:", productsError);
      return;
    }

    console.log(`✅ Found ${products.length} products to update`);

    // Update each product with a different image
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const imageIndex = i % availableImages.length; // Cycle through available images
      const newImage = availableImages[imageIndex];

      console.log(`\n${i + 1}. Updating: ${product.title}`);
      console.log(`   Old image: ${product.image.substring(0, 60)}...`);
      console.log(`   New image: ${newImage.substring(0, 60)}...`);

      // Update the product with new image
      const { data: updatedProduct, error: updateError } = await supabase
        .from("products")
        .update({
          image: newImage,
          images: [newImage], // Also update images array
        })
        .eq("id", product.id)
        .select()
        .single();

      if (updateError) {
        console.error(`   ❌ Error updating ${product.title}:`, updateError);
      } else {
        console.log(`   ✅ Successfully updated ${product.title}`);
      }
    }

    // Verify the updates
    console.log("\n🔍 Verifying updates...");
    const { data: verifyProducts, error: verifyError } = await supabase
      .from("products")
      .select("*")
      .eq("brand_id", brandId)
      .eq("collection_id", collectionId)
      .order("created_at");

    if (verifyError) {
      console.error("❌ Error verifying products:", verifyError);
    } else {
      console.log("✅ Verification complete:");
      verifyProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.title}`);
        console.log(`      Image: ${product.image.substring(0, 60)}...`);
        console.log(
          `      Price: $${product.price}${product.sale_price ? ` (Sale: $${product.sale_price})` : ""}`
        );
      });
    }

    console.log("\n🎉 Successfully updated all products with storage images!");
    console.log(
      "💡 Products now use a variety of images from the site's storage"
    );
    console.log(
      "🖼️ This provides visual consistency with the brand's uploaded assets"
    );
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

updateEhbsProductsWithStorageImages();
