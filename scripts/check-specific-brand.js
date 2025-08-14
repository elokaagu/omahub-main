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

async function checkSpecificBrand() {
  try {
    console.log("🔍 Checking specific brand: Studio Bonnitta");

    // Get the specific brand
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name, image, created_at")
      .eq("name", "Studio Bonnitta")
      .single();

    if (brandError) {
      console.error("❌ Error fetching brand:", brandError);
      return;
    }

    console.log(`📋 Brand found: ${brand.name}`);
    console.log(`   ID: ${brand.id}`);
    console.log(`   Image: ${brand.image}`);
    console.log(`   Created: ${brand.created_at}`);

    // Check if the image URL is accessible
    if (brand.image && !brand.image.includes("placeholder")) {
      console.log("\n🧪 Testing image URL accessibility...");

      try {
        const response = await fetch(brand.image);
        console.log(`   Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const contentType = response.headers.get("content-type");
          const contentLength = response.headers.get("content-length");
          console.log(
            `   ✅ Success! Content-Type: ${contentType}, Size: ${contentLength} bytes`
          );
        } else {
          console.log(`   ❌ Failed to load image`);
        }
      } catch (fetchError) {
        console.log(`   ❌ Fetch error: ${fetchError.message}`);
      }
    } else {
      console.log(
        "\n⚠️ Brand has placeholder image - this is expected if no original image exists"
      );
    }

    // Also check what the brand should have according to our fix logic
    console.log(
      "\n🔧 Checking what this brand should have according to fix logic..."
    );

    const { data: allBrands, error: allBrandsError } = await supabase
      .from("brands")
      .select("id, name, image")
      .order("name");

    if (allBrandsError) {
      console.error("❌ Error fetching all brands:", allBrandsError);
      return;
    }

    const brandIndex = allBrands.findIndex((b) => b.name === "Studio Bonnitta");
    console.log(
      `   Brand position in alphabetical order: ${brandIndex + 1} of ${allBrands.length}`
    );

    if (brandIndex < 10) {
      console.log(
        `   Should have: Original brand image (position ${brandIndex + 1} < 10)`
      );
    } else if (brandIndex < 13) {
      console.log(
        `   Should have: Collection image (position ${brandIndex + 1} between 10-13)`
      );
    } else {
      console.log(
        `   Should have: Placeholder image (position ${brandIndex + 1} > 13)`
      );
    }

    // Check if we need to re-run the fix
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
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/brands/wgq6cqpxoja_1749483084652.jpeg",
    ];

    const collectionImages = [
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/collections/vq5uh8faje8_1748789795131.png",
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/collections/wktqcn3zb5_1748805951528.png",
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/brand-assets/collections/ygi6c1nrhfe_1748797926376.png",
    ];

    console.log(`\n📊 Available images summary:`);
    console.log(`   Original brand images: ${availableImages.length}`);
    console.log(`   Collection images: ${collectionImages.length}`);
  } catch (error) {
    console.error("❌ Error in checkSpecificBrand:", error);
  }
}

// Run the check
checkSpecificBrand()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
