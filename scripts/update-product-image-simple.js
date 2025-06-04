const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateProductImage() {
  try {
    const collectionId = "c7d7aef3-73ce-40f0-b84d-89cd15a4179f";
    const collectionImageUrl =
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/collections/wktqcn3zb5_1748805951528.png";

    console.log("🔄 Updating product image...");
    console.log("🖼️ New image URL:", collectionImageUrl);

    // Update the product to use the collection's image
    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update({
        image: collectionImageUrl,
      })
      .eq("brand_id", "ehbs-couture")
      .eq("collection_id", collectionId)
      .select();

    if (updateError) {
      console.error("❌ Error updating product:", updateError);
      return;
    }

    if (updatedProduct && updatedProduct.length > 0) {
      console.log("✅ Successfully updated product image");
      console.log("📦 Product:", updatedProduct[0].title);
      console.log("🖼️ New image:", updatedProduct[0].image);
    } else {
      console.log("⚠️ No product found to update");
    }

    // Verify the update
    console.log("\n🔍 Verifying the update...");
    const { data: verifyProduct } = await supabase
      .from("products")
      .select("*")
      .eq("brand_id", "ehbs-couture")
      .eq("collection_id", collectionId)
      .single();

    if (verifyProduct) {
      console.log("✅ Verification successful:");
      console.log("   Product:", verifyProduct.title);
      console.log("   Image URL:", verifyProduct.image);
      console.log(
        "   Price:",
        `$${verifyProduct.price} (Sale: $${verifyProduct.sale_price})`
      );
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

updateProductImage();
