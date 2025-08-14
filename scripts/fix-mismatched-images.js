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

async function fixMismatchedImages() {
  try {
    console.log("🔧 Fixing mismatched brand images...");
    
    // Get all brands
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image")
      .order("name");
    
    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }
    
    console.log(`📋 Found ${brands.length} brands to process`);
    
    // Available original images from storage
    const availableImages = [
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/brands/2te7usrxhul_1748368664929.jpeg",
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/brands/942ttauz38_1749487526532.jpeg",
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/brands/98l8xn8xcpi_1748789357220.jpg",
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/brands/dwliuy2y9lh_1748368219539.jpeg",
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/brands/ij3p67bklvc_1749487247626.png",
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/brands/ioq3slxyv4p_1748383737574.webp",
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/brands/nzg80m82fhf_1749471787591.png",
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/brands/om3cjv9cn2c_1748787827260.png",
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/brands/su5qsuv6bl_1748788317778.jpg",
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/brands/wgq6cqpxoja_1749483084652.jpeg"
    ];
    
    // Collection images for products
    const collectionImages = [
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/collections/vq5uh8faje8_1748789795131.png",
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/collections/wktqcn3zb5_1748805951528.png",
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/collections/ygi6c1nrhfe_1748797926376.png"
    ];
    
    console.log(`🖼️ Available original brand images: ${availableImages.length}`);
    console.log(`🖼️ Available collection images: ${collectionImages.length}`);
    
    // Strategy: Assign original images to first 10 brands, then use collection images for next few, then placeholders
    let imageIndex = 0;
    let collectionIndex = 0;
    
    for (let i = 0; i < brands.length; i++) {
      const brand = brands[i];
      let newImageUrl;
      
      if (i < availableImages.length) {
        // Use original brand images for first 10 brands
        newImageUrl = availableImages[imageIndex];
        imageIndex++;
        console.log(`✅ ${brand.name}: Using original brand image`);
      } else if (i < availableImages.length + collectionImages.length) {
        // Use collection images for next few brands
        newImageUrl = collectionImages[collectionIndex];
        collectionIndex++;
        console.log(`🖼️ ${brand.name}: Using collection image`);
      } else {
        // Use placeholder for remaining brands
        newImageUrl = "https://via.placeholder.com/400x600/f3f4f6/9ca3af?text=Image+Coming+Soon";
        console.log(`📝 ${brand.name}: Using placeholder image`);
      }
      
      // Update the brand's image
      const { error: updateError } = await supabase
        .from("brands")
        .update({ image: newImageUrl })
        .eq("id", brand.id);
      
      if (updateError) {
        console.error(`❌ Failed to update ${brand.name}:`, updateError);
      } else {
        console.log(`✅ Updated ${brand.name} with new image`);
      }
    }
    
    // Also fix products that have placeholder images
    console.log("\n📦 Fixing product images...");
    
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, image")
      .like("image", "%placeholder%");
    
    if (productsError) {
      console.error("❌ Error fetching products:", productsError);
    } else {
      console.log(`📋 Found ${products.length} products with placeholder images`);
      
      // Distribute collection images to products
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const newImageUrl = collectionImages[i % collectionImages.length];
        
        const { error: updateError } = await supabase
          .from("products")
          .update({ image: newImageUrl })
          .eq("id", product.id);
        
        if (updateError) {
          console.error(`❌ Failed to update product ${product.title}:`, updateError);
        } else {
          console.log(`✅ Updated product ${product.title} with collection image`);
        }
      }
    }
    
    console.log("\n🎉 Image mismatch fix completed!");
    
  } catch (error) {
    console.error("❌ Error in fixMismatchedImages:", error);
  }
}

// Run the fix
fixMismatchedImages().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
