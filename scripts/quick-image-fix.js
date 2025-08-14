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

async function quickImageFix() {
  try {
    console.log("🚀 Quick image fix - setting all images to placeholder...");
    
    // Create a simple placeholder image URL
    const placeholderImage = "https://via.placeholder.com/400x600/f3f4f6/9ca3af?text=Image+Coming+Soon";
    
    // Fix brands
    console.log("\n🏷️ Fixing brand images...");
    const { error: brandsError } = await supabase
      .from("brands")
      .update({ image: placeholderImage })
      .not("image", "is", null);
    
    if (brandsError) {
      console.error("❌ Error updating brands:", brandsError);
    } else {
      console.log("✅ Updated all brand images");
    }
    
    // Fix products
    console.log("\n📦 Fixing product images...");
    const { error: productsError } = await supabase
      .from("products")
      .update({ image: placeholderImage })
      .not("image", "is", null);
    
    if (productsError) {
      console.error("❌ Error updating products:", productsError);
    } else {
      console.log("✅ Updated all product images");
    }
    
    // Fix collections
    console.log("\n🖼️ Fixing collection images...");
    const { error: collectionsError } = await supabase
      .from("collections")
      .update({ image: placeholderImage })
      .not("image", "is", null);
    
    if (collectionsError) {
      console.error("❌ Error updating collections:", collectionsError);
    } else {
      console.log("✅ Updated all collection images");
    }
    
    console.log("\n🎉 Quick image fix completed!");
    console.log("All images now use placeholder: " + placeholderImage);
    
  } catch (error) {
    console.error("❌ Error in quickImageFix:", error);
  }
}

// Run the fix
quickImageFix().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
