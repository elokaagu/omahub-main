const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getCollectionImages() {
  try {
    const collectionId = "c7d7aef3-73ce-40f0-b84d-89cd15a4179f";

    console.log("🖼️ Checking collection images...");
    console.log("Collection ID:", collectionId);

    // Get collection info
    const { data: collection } = await supabase
      .from("collections")
      .select("*")
      .eq("id", collectionId)
      .single();

    if (collection) {
      console.log("✅ Collection found:", collection.title);
      console.log("📸 Main collection image:", collection.image);
    }

    // Check if collection_images table exists and get images
    console.log("\n🔍 Checking collection gallery images...");
    const { data: galleryImages, error: galleryError } = await supabase
      .from("collection_images")
      .select("*")
      .eq("collection_id", collectionId)
      .order("display_order");

    if (galleryError) {
      console.log(
        "⚠️ Collection images table might not exist or no images found:",
        galleryError.message
      );
    } else {
      console.log(`✅ Gallery images found: ${galleryImages?.length || 0}`);
      if (galleryImages && galleryImages.length > 0) {
        galleryImages.forEach((img, index) => {
          console.log(`📷 Image ${index + 1}:`, {
            url: img.image_url,
            alt: img.alt_text,
            featured: img.is_featured,
          });
        });
      }
    }

    // Let's also check what images are available in the brand assets
    console.log("\n🔍 Checking available brand asset images...");

    // Since we can't directly query storage, let's use some common fashion image URLs
    const fashionImages = [
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=800&fit=crop", // Elegant dress
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=800&fit=crop", // Evening gown
      "https://images.unsplash.com/photo-1566479179817-c0b5b4b8b1b1?w=800&h=800&fit=crop", // Current product image
      "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&h=800&fit=crop", // Fashion model
      "https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=800&h=800&fit=crop", // Couture dress
      collection.image, // Current collection image
    ];

    console.log("🎨 Available fashion images for product:");
    fashionImages.forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });

    // Recommend using the collection image for the product
    console.log("\n💡 Recommendation:");
    console.log(
      "Use the collection's main image for the product:",
      collection.image
    );
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

getCollectionImages();
