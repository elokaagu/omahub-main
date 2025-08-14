const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  console.log("Required variables:");
  console.log("- NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
  console.log("- SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixBrokenImageUrls() {
  try {
    console.log("🔧 Starting comprehensive image URL fix...");
    
    // Step 1: Check what storage buckets exist
    console.log("\n📦 Checking storage buckets...");
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("❌ Error listing buckets:", bucketsError);
      return;
    }
    
    console.log("Available buckets:", buckets.map(b => b.name).join(", "));
    
    // Step 2: Check what's actually in the brand-assets bucket
    console.log("\n🔍 Checking brand-assets bucket contents...");
    const { data: brandAssetsFiles, error: brandAssetsError } = await supabase.storage
      .from("brand-assets")
      .list("", { limit: 1000 });
    
    if (brandAssetsError) {
      console.error("❌ Error listing brand-assets:", brandAssetsError);
      return;
    }
    
    console.log(`Found ${brandAssetsFiles.length} files in brand-assets bucket`);
    
    // Step 3: Get all brands with images
    console.log("\n🏷️ Checking brands table...");
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image");
    
    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }
    
    console.log(`Found ${brands.length} brands`);
    
    // Step 4: Check each brand image and fix if needed
    let fixedBrands = 0;
    for (const brand of brands) {
      if (!brand.image) continue;
      
      console.log(`\n🔍 Checking brand: ${brand.name}`);
      console.log(`   Current image: ${brand.image}`);
      
      // Check if the image URL is valid
      if (brand.image.includes("/storage/v1/object/public/")) {
        // Extract bucket and path from URL
        const urlParts = brand.image.split("/storage/v1/object/public/");
        if (urlParts.length === 2) {
          const [bucket, path] = urlParts;
          
          // Check if this file actually exists in storage
          try {
            const { data: fileExists, error: fileError } = await supabase.storage
              .from(bucket)
              .list(path.split("/").slice(0, -1).join("/"), { limit: 1 });
            
            if (fileError || !fileExists || fileExists.length === 0) {
              console.log(`   ❌ File not found in storage: ${path}`);
              
              // Try to find a replacement image
              const replacementImage = await findReplacementImage(brand.name, brandAssetsFiles);
              
              if (replacementImage) {
                console.log(`   ✅ Found replacement: ${replacementImage}`);
                
                // Update the brand with the replacement image
                const { error: updateError } = await supabase
                  .from("brands")
                  .update({ image: replacementImage })
                  .eq("id", brand.id);
                
                if (updateError) {
                  console.log(`   ❌ Failed to update: ${updateError.message}`);
                } else {
                  console.log(`   ✅ Updated successfully`);
                  fixedBrands++;
                }
              } else {
                console.log(`   ⚠️ No replacement found, setting placeholder`);
                
                // Set a placeholder image
                const placeholderImage = `${supabaseUrl}/storage/v1/object/public/brand-assets/placeholder-brand.jpg`;
                
                const { error: updateError } = await supabase
                  .from("brands")
                  .update({ image: placeholderImage })
                  .eq("id", brand.id);
                
                if (updateError) {
                  console.log(`   ❌ Failed to set placeholder: ${updateError.message}`);
                } else {
                  console.log(`   ✅ Set placeholder successfully`);
                  fixedBrands++;
                }
              }
            } else {
              console.log(`   ✅ File exists in storage`);
            }
          } catch (checkError) {
            console.log(`   ❌ Error checking file: ${checkError.message}`);
          }
        }
      } else {
        console.log(`   ⚠️ Not a storage URL, skipping`);
      }
    }
    
    // Step 5: Check products
    console.log("\n📦 Checking products table...");
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, image");
    
    if (productsError) {
      console.error("❌ Error fetching products:", productsError);
      return;
    }
    
    console.log(`Found ${products.length} products`);
    
    let fixedProducts = 0;
    for (const product of products) {
      if (!product.image) continue;
      
      console.log(`\n🔍 Checking product: ${product.title}`);
      console.log(`   Current image: ${product.image}`);
      
      if (product.image.includes("/storage/v1/object/public/")) {
        const urlParts = product.image.split("/storage/v1/object/public/");
        if (urlParts.length === 2) {
          const [bucket, path] = urlParts;
          
          try {
            const { data: fileExists, error: fileError } = await supabase.storage
              .from(bucket)
              .list(path.split("/").slice(0, -1).join("/"), { limit: 1 });
            
            if (fileError || !fileExists || fileExists.length === 0) {
              console.log(`   ❌ File not found in storage: ${path}`);
              
              // Set a placeholder for products
              const placeholderImage = `${supabaseUrl}/storage/v1/object/public/brand-assets/placeholder-product.jpg`;
              
              const { error: updateError } = await supabase
                .from("products")
                .update({ image: placeholderImage })
                .eq("id", product.id);
              
              if (updateError) {
                console.log(`   ❌ Failed to set placeholder: ${updateError.message}`);
              } else {
                console.log(`   ✅ Set placeholder successfully`);
                fixedProducts++;
              }
            } else {
              console.log(`   ✅ File exists in storage`);
            }
          } catch (checkError) {
            console.log(`   ❌ Error checking file: ${checkError.message}`);
          }
        }
      }
    }
    
    // Step 6: Check collections
    console.log("\n🖼️ Checking collections table...");
    const { data: collections, error: collectionsError } = await supabase
      .from("collections")
      .select("id, name, image");
    
    if (collectionsError) {
      console.error("❌ Error fetching collections:", collectionsError);
      return;
    }
    
    console.log(`Found ${collections.length} collections`);
    
    let fixedCollections = 0;
    for (const collection of collections) {
      if (!collection.image) continue;
      
      console.log(`\n🔍 Checking collection: ${collection.name}`);
      console.log(`   Current image: ${collection.image}`);
      
      if (collection.image.includes("/storage/v1/object/public/")) {
        const urlParts = collection.image.split("/storage/v1/object/public/");
        if (urlParts.length === 2) {
          const [bucket, path] = urlParts;
          
          try {
            const { data: fileExists, error: fileError } = await supabase.storage
              .from(bucket)
              .list(path.split("/").slice(0, -1).join("/"), { limit: 1 });
            
            if (fileError || !fileExists || fileExists.length === 0) {
              console.log(`   ❌ File not found in storage: ${path}`);
              
              // Set a placeholder for collections
              const placeholderImage = `${supabaseUrl}/storage/v1/object/public/brand-assets/placeholder-collection.jpg`;
              
              const { error: updateError } = await supabase
                .from("collections")
                .update({ image: placeholderImage })
                .eq("id", collection.id);
              
              if (updateError) {
                console.log(`   ❌ Failed to set placeholder: ${updateError.message}`);
              } else {
                console.log(`   ✅ Set placeholder successfully`);
                fixedCollections++;
              }
            } else {
              console.log(`   ✅ File exists in storage`);
            }
          } catch (checkError) {
            console.log(`   ❌ Error checking file: ${checkError.message}`);
          }
        }
      }
    }
    
    console.log("\n🎉 Image URL fix completed!");
    console.log(`✅ Fixed ${fixedBrands} brands`);
    console.log(`✅ Fixed ${fixedProducts} products`);
    console.log(`✅ Fixed ${fixedCollections} collections`);
    
  } catch (error) {
    console.error("❌ Error in fixBrokenImageUrls:", error);
  }
}

async function findReplacementImage(brandName, availableFiles) {
  // Try to find a suitable replacement image from available files
  for (const file of availableFiles) {
    if (file.name && file.name.includes("brand") && !file.name.includes("placeholder")) {
      return `${supabaseUrl}/storage/v1/object/public/brand-assets/${file.name}`;
    }
  }
  
  // If no brand-specific image found, return any available image
  for (const file of availableFiles) {
    if (file.name && !file.name.includes("placeholder")) {
      return `${supabaseUrl}/storage/v1/object/public/brand-assets/${file.name}`;
    }
  }
  
  return null;
}

// Run the fix
fixBrokenImageUrls().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
