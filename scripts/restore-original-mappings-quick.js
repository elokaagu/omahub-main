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

async function restoreOriginalMappingsQuick() {
  try {
    console.log("🎯 QUICK FIX: Restoring Original Brand-Image Mappings!");
    console.log("=".repeat(70));
    console.log(
      "Using the original mappings from your fix-brand-image-matching.js script"
    );
    console.log(
      "but updating them to use the brand-assets bucket instead of product-images"
    );
    console.log("");

    // 1. The ORIGINAL brand-image mappings from your script
    const originalBrandImageMapping = {
      // Fashion brands - EXACTLY as you set them up originally!
      "Ehbs Couture": "2a14c31f_1750014167916.png",
      "54 Stitches": "2a14c31f_1750014181103.jpg",
      "Style Envie": "2a14c31f_1751697369303.png",
      Rendoll: "2a14c31f_1751697426772.png",
      Melira: "2a14c31f_1751697481807.png",
      "Rebecca Tembo": "2a14c31f_1751697555391.png",
      Malité: "2a14c31f_1754921287160.jpg",
      "Kyan Atelier": "2a14c31f_1754921374600.jpg",
      "The Ivy Mark": "2a14c31f_1754922636952.jpg",
      Anko: "2a14c31f_1754922644588.jpg",
      Mairachamp: "2a14c31f_1754922901387.jpg",
      "Adesilver Spitalfields": "2a14c31f_1754922906242.jpg",
      Kisara: "2a14c31f_1754923041815.jpg",
      "Cisca Cecil": "2a14c31f_1754927861744.jpg",
      "Kai Collective": "2a14c31f_1754928137922.jpg",
      "ANDREA IYAMAH": "2a14c31f_1754929558787.jpeg",
      Imaulé: "2a14c31f_1754929565297.jpeg",
      "K Í L È N T Á R": "2a14c31f_1754929569195.jpeg",
      KUWAJ: "2a14c31f_1754929586576.jpeg",
      Onalaja: "2a14c31f_1754929587340.jpeg",
      "Studio Bonnitta": "2a14c31f_1754930371018.jpg",
      "Banke Kuku": "2a14c31f_1754930377566.jpg",
      "Burgundy Atelier": "2a14c31f_1754930388750.jpg",
      "Elizabeth and Lace Bridal": "2a14c31f_1754930395431.jpg",
      Lauve: "2a14c31f_1754930402688.jpg",
      Knafe: "2a14c31f_1754930640237.jpg",
      Vivendii: "2a14c31f_1754930666712.jpg",
      Nack: "2a14c31f_1754930675714.jpg",
      Gbemi: "2a14c31f_1754930685976.jpg",
      "Royalty by Mojisola": "2a14c31f_1754930697373.jpg",
      Ometseyofficial: "2a14c31f_1754930725863.jpg",
      Ometseybespoke: "2a14c31f_1754931025832.jpeg",
      Ehbinyo: "2a14c31f_1754931042312.jpg",
      "THE BOUTIQUE BY SB": "2a14c31f_1754931102561.jpeg",
      "Tem Ade": "2a14c31f_1754931262167.jpg",
      "Henri Uduku": "2a14c31f_1754931267161.jpeg",
      "Fits by Dunni": "2a14c31f_1754931276149.jpg",
      "Bouqui Glamhouse": "2a14c31f_1754932180197.jpg",
      Gnation: "2a14c31f_1754932189632.jpg",
    };

    console.log(
      `🗺️ Found ${Object.keys(originalBrandImageMapping).length} original brand-image mappings`
    );

    // 2. Get all brands from database
    console.log("\n🏷️ Step 1: Getting brands from database...");

    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image")
      .order("name");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    console.log(`📋 Found ${brands.length} brands in database`);

    // 3. Update each brand with their ORIGINAL image (but from brand-assets bucket)
    console.log("\n🔄 Step 2: Restoring original brand-image mappings...");

    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const brand of brands) {
      const originalImageName = originalBrandImageMapping[brand.name];

      if (originalImageName) {
        // Create the URL using brand-assets bucket instead of product-images
        const imageUrl = `${supabaseUrl}/storage/v1/object/public/brand-assets/${originalImageName}`;

        try {
          console.log(`\n🔄 Restoring ${brand.name}:`);
          console.log(`   📸 Original Image: ${originalImageName}`);
          console.log(`   🔗 New URL: ${imageUrl}`);

          const { error: updateError } = await supabase
            .from("brands")
            .update({ image: imageUrl })
            .eq("id", brand.id);

          if (updateError) {
            console.error(
              `   ❌ Error updating ${brand.name}:`,
              updateError.message
            );
            errorCount++;
          } else {
            console.log(
              `   ✅ Successfully restored original image for ${brand.name}`
            );
            updatedCount++;
          }
        } catch (e) {
          console.error(`   ❌ Exception updating ${brand.name}:`, e.message);
          errorCount++;
        }
      } else {
        console.log(`⚠️ No original mapping found for: ${brand.name}`);
        skippedCount++;
      }
    }

    // 4. Summary
    console.log("\n" + "=".repeat(70));
    console.log("🎯 QUICK RESTORATION COMPLETED!");

    if (updatedCount > 0) {
      console.log(
        `\n✅ Successfully restored ${updatedCount} original brand images!`
      );
      console.log(`   - Used your EXACT original brand-image mappings`);
      console.log(`   - Updated to use brand-assets bucket`);
      console.log(`   - No manual mapping required!`);

      console.log("\n🚀 Next steps:");
      console.log("   1. Clear your browser cache completely");
      console.log("   2. Hard refresh the homepage (Ctrl+F5 or Cmd+Shift+R)");
      console.log(
        "   3. Brand images should now be EXACTLY as you set them up originally!"
      );

      console.log("\n💡 What was fixed:");
      console.log("   - Restored your original brand-image assignments");
      console.log("   - No more chronological matching issues");
      console.log("   - Each brand has its proper, original image");
    } else {
      console.log("\n❌ No brand images were restored");
    }

    console.log(`\n📊 Final results:`);
    console.log(`   ✅ Successfully restored: ${updatedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   ⚠️ Skipped (no mapping): ${skippedCount}`);
  } catch (error) {
    console.error("❌ Error in restoreOriginalMappingsQuick:", error);
  }
}

// Run the quick restoration
restoreOriginalMappingsQuick()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
