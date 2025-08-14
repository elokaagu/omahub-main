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

async function fixBrandImageMatching() {
  try {
    console.log("🔍 Fixing brand image matching...");
    
    // 1. Get all brands with their current images
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image, created_at")
      .order("name");
    
    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }
    
    console.log(`📋 Found ${brands.length} brands`);
    
    // 2. Get all images from product-images bucket
    const { data: productImages, error: imagesError } = await supabase.storage
      .from("product-images")
      .list("", { limit: 1000 });
    
    if (imagesError) {
      console.error("❌ Error fetching product images:", imagesError);
      return;
    }
    
    // Filter for actual image files (not folders)
    const imageFiles = productImages.filter(file => 
      file.name.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i) &&
      !file.name.includes('brands') // Exclude the brands folder
    );
    
    console.log(`🖼️ Found ${imageFiles.length} image files`);
    
    // 3. Create a mapping of brand names to their correct images
    // This is based on the actual brand names and image patterns
    const brandImageMapping = {
      // Fashion brands
      "Ehbs Couture": "2a14c31f_1750014167916.png",
      "54 Stitches": "2a14c31f_1750014181103.jpg",
      "Style Envie": "2a14c31f_1751697369303.png",
      "Rendoll": "2a14c31f_1751697426772.png",
      "Melira": "2a14c31f_1751697481807.png",
      "Rebecca Tembo": "2a14c31f_1751697555391.png",
      "Malité": "2a14c31f_1754921287160.jpg",
      "Kyan Atelier": "2a14c31f_1754921374600.jpg",
      "The Ivy Mark": "2a14c31f_1754922636952.jpg",
      "Anko": "2a14c31f_1754922644588.jpg",
      "Mairachamp": "2a14c31f_1754922901387.jpg",
      "Adesilver Spitalfields": "2a14c31f_1754922906242.jpg",
      "Kisara": "2a14c31f_1754923041815.jpg",
      "Cisca Cecil": "2a14c31f_1754927861744.jpg",
      "Kai Collective": "2a14c31f_1754928137922.jpg",
      "ANDREA IYAMAH": "2a14c31f_1754929558787.jpeg",
      "Imaulé": "2a14c31f_1754929565297.jpeg",
      "K Í L È N T Á R": "2a14c31f_1754929569195.jpeg",
      "KUWAJ": "2a14c31f_1754929586576.jpeg",
      "Onalaja": "2a14c31f_1754929587340.jpeg",
      "Studio Bonnitta": "2a14c31f_1754930371018.jpg",
      "Banke Kuku": "2a14c31f_1754930377566.jpg",
      "Burgundy Atelier": "2a14c31f_1754930388750.jpg",
      "Elizabeth and Lace Bridal": "2a14c31f_1754930395431.jpg",
      "Lauve": "2a14c31f_1754930402688.jpg",
      "Knafe": "2a14c31f_1754930640237.jpg",
      "Vivendii": "2a14c31f_1754930666712.jpg",
      "Nack": "2a14c31f_1754930675714.jpg",
      "Gbemi": "2a14c31f_1754930685976.jpg",
      "Royalty by Mojisola": "2a14c31f_1754930697373.jpg",
      "Ometseyofficial": "2a14c31f_1754930725863.jpg",
      "Ometseybespoke": "2a14c31f_1754931025832.jpeg",
      "Ehbinyo": "2a14c31f_1754931042312.jpg",
      "THE BOUTIQUE BY SB": "2a14c31f_1754931102561.jpeg",
      "Tem Ade": "2a14c31f_1754931262167.jpg",
      "Henri Uduku": "2a14c31f_1754931267161.jpeg",
      "Fits by Dunni": "2a14c31f_1754931276149.jpg",
      "Bouqui Glamhouse": "2a14c31f_1754932180197.jpg",
      "Gnation": "2a14c31f_1754932189632.jpg"
    };
    
    console.log(`🗺️ Created mapping for ${Object.keys(brandImageMapping).length} brands`);
    
    // 4. Update each brand with their correct image
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const brand of brands) {
      const correctImageName = brandImageMapping[brand.name];
      
      if (correctImageName) {
        // Check if this image file actually exists
        const imageExists = imageFiles.find(file => file.name === correctImageName);
        
        if (imageExists) {
          const imageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${correctImageName}`;
          
          console.log(`\n🔗 Updating ${brand.name}:`);
          console.log(`   Current image: ${brand.image ? brand.image.substring(0, 80) + '...' : 'None'}`);
          console.log(`   Correct image: ${correctImageName}`);
          console.log(`   New URL: ${imageUrl}`);
          
          // Update the brand's image
          const { error: updateError } = await supabase
            .from("brands")
            .update({ image: imageUrl })
            .eq("id", brand.id);
          
          if (updateError) {
            console.error(`   ❌ Failed to update ${brand.name}:`, updateError);
            errorCount++;
          } else {
            console.log(`   ✅ Successfully updated ${brand.name}`);
            updatedCount++;
          }
        } else {
          console.log(`⚠️ Image file not found for ${brand.name}: ${correctImageName}`);
          errorCount++;
        }
      } else {
        console.log(`⚠️ No mapping found for brand: ${brand.name}`);
        errorCount++;
      }
    }
    
    // 5. Verify the updates
    console.log("\n🔍 Verifying updates...");
    const { data: updatedBrands, error: verifyError } = await supabase
      .from("brands")
      .select("name, image")
      .order("name");
    
    if (!verifyError && updatedBrands) {
      const brandsWithRealImages = updatedBrands.filter(b => 
        b.image && !b.image.includes("placeholder")
      );
      
      console.log(`✅ ${brandsWithRealImages.length} brands now have real images`);
      console.log(`📝 ${updatedBrands.length - brandsWithRealImages.length} brands still have issues`);
      
      // Show a few examples
      console.log("\n📸 Sample updated images:");
      updatedBrands.slice(0, 10).forEach(brand => {
        const hasRealImage = brand.image && !brand.image.includes("placeholder");
        const imageName = brand.image ? brand.image.split('/').pop() : 'None';
        console.log(`   ${brand.name}: ${hasRealImage ? "✅ " + imageName : "❌ " + imageName}`);
      });
    }
    
    console.log(`\n🎉 Brand image matching completed!`);
    console.log(`   Updated: ${updatedCount} brands`);
    console.log(`   Errors: ${errorCount} brands`);
    
  } catch (error) {
    console.error("❌ Error in fixBrandImageMatching:", error);
  }
}

// Run the fix
fixBrandImageMatching().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
