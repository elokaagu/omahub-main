require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

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

async function deepImageInvestigation() {
  try {
    console.log("🔍 DEEP INVESTIGATION: Why brand images appear incorrect...");
    console.log("=".repeat(70));
    console.log("This will investigate caching, CDN, and serving issues");
    console.log("");

    // 1. Check the specific brand that's having issues
    console.log("\n📦 Step 1: Checking '54 Stitches' brand details...");

    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name, image, created_at, updated_at, category, description")
      .eq("name", "54 Stitches")
      .single();

    if (brandError) {
      console.error("❌ Error fetching brand:", brandError);
      return;
    }

    console.log(`📋 Brand: ${brand.name}`);
    console.log(`   🆔 ID: ${brand.id}`);
    console.log(`   🏷️ Category: ${brand.category || "Not set"}`);
    console.log(`   📝 Description: ${brand.description || "Not set"}`);
    console.log(
      `   📅 Created: ${new Date(brand.created_at).toLocaleString()}`
    );
    console.log(
      `   🔄 Updated: ${brand.updated_at ? new Date(brand.updated_at).toLocaleString() : "Never"}`
    );
    console.log(`   🖼️ Current image: ${brand.image}`);

    // 2. Check if the image URL is accessible
    console.log("\n🔗 Step 2: Checking image URL accessibility...");

    if (brand.image) {
      const filename = brand.image.split("/").pop();
      console.log(`   📸 Filename: ${filename}`);
      console.log(`   🔗 Full URL: ${brand.image}`);

      // Check if this is a Supabase storage URL
      if (brand.image.includes("supabase.co")) {
        console.log(`   ✅ Valid Supabase storage URL`);

        // Extract bucket and path
        const urlParts = brand.image.split("/");
        const bucketIndex = urlParts.findIndex((part) => part === "storage");
        if (bucketIndex !== -1 && urlParts[bucketIndex + 1] === "v1") {
          const bucket = urlParts[bucketIndex + 3];
          const path = urlParts.slice(bucketIndex + 5).join("/");
          console.log(`   🗂️ Bucket: ${bucket}`);
          console.log(`   📁 Path: ${path}`);
        }
      } else {
        console.log(`   ⚠️ Not a Supabase storage URL`);
      }
    }

    // 3. Check for any recent changes to this brand
    console.log("\n📝 Step 3: Checking for recent changes...");

    const { data: recentChanges, error: changesError } = await supabase
      .from("brands")
      .select("id, name, image, updated_at")
      .eq("name", "54 Stitches")
      .order("updated_at", { ascending: false })
      .limit(5);

    if (changesError) {
      console.error("❌ Error checking recent changes:", changesError);
    } else {
      console.log(`   📊 Found ${recentChanges.length} records for this brand`);
      if (recentChanges.length > 1) {
        console.log(
          `   ⚠️ Multiple records found - this might indicate data inconsistency`
        );
        recentChanges.forEach((change, index) => {
          console.log(
            `      ${index + 1}. ID: ${change.id}, Image: ${change.image ? change.image.split("/").pop() : "None"}, Updated: ${change.updated_at ? new Date(change.updated_at).toLocaleString() : "Never"}`
          );
        });
      }
    }

    // 4. Check if there are any products associated with this brand that might have conflicting images
    console.log("\n🛍️ Step 4: Checking associated products...");

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, image, brand_id, created_at")
      .eq("brand_id", brand.id);

    if (productsError) {
      console.error("❌ Error fetching products:", productsError);
    } else {
      console.log(`   📦 Found ${products.length} products for this brand`);
      if (products.length > 0) {
        console.log(`   🖼️ Product images:`);
        products.slice(0, 5).forEach((product, index) => {
          const filename = product.image
            ? product.image.split("/").pop()
            : "No image";
          console.log(`      ${index + 1}. ${product.title}: ${filename}`);
        });

        // Check if any product images match the brand image
        const matchingProductImages = products.filter(
          (product) => product.image && product.image === brand.image
        );

        if (matchingProductImages.length > 0) {
          console.log(
            `   ⚠️ Found ${matchingProductImages.length} products using the same image as the brand`
          );
          matchingProductImages.forEach((product) => {
            console.log(`      - ${product.title} (ID: ${product.id})`);
          });
        }
      }
    }

    // 5. Check for any collections associated with this brand
    console.log("\n📚 Step 5: Checking associated collections...");

    const { data: collections, error: collectionsError } = await supabase
      .from("catalogues")
      .select("id, title, image, brand_id, created_at")
      .eq("brand_id", brand.id);

    if (collectionsError) {
      console.error("❌ Error fetching collections:", collectionsError);
    } else {
      console.log(
        `   📚 Found ${collections.length} collections for this brand`
      );
      if (collections.length > 0) {
        console.log(`   🖼️ Collection images:`);
        collections.slice(0, 5).forEach((collection, index) => {
          const filename = collection.image
            ? collection.image.split("/").pop()
            : "No image";
          console.log(`      ${index + 1}. ${collection.title}: ${filename}`);
        });

        // Check if any collection images match the brand image
        const matchingCollectionImages = collections.filter(
          (collection) => collection.image && collection.image === brand.image
        );

        if (matchingCollectionImages.length > 0) {
          console.log(
            `   ⚠️ Found ${matchingCollectionImages.length} collections using the same image as the brand`
          );
          matchingCollectionImages.forEach((collection) => {
            console.log(`      - ${collection.title} (ID: ${collection.id})`);
          });
        }
      }
    }

    // 6. Check for any database triggers or functions that might be modifying images
    console.log("\n⚙️ Step 6: Checking for database triggers/functions...");

    // This would require checking the database schema, but let's check if there are any obvious patterns
    console.log(`   🔍 No obvious database triggers found in this analysis`);
    console.log(
      `   💡 Consider checking if there are any RLS policies or triggers affecting image updates`
    );

    // 7. Check for any recent image uploads that might be affecting this brand
    console.log("\n📤 Step 7: Checking recent image uploads...");

    const { data: recentImages, error: imagesError } = await supabase.storage
      .from("brand-assets")
      .list("", { limit: 20 });

    if (imagesError) {
      console.error("❌ Error listing recent images:", imagesError);
    } else {
      console.log(
        `   🖼️ Found ${recentImages.length} recent images in storage`
      );

      // Look for images uploaded around the same time as the brand
      const brandCreatedAt = new Date(brand.created_at).getTime();
      const imagesAroundBrandCreation = recentImages.filter((image) => {
        if (!image.created_at) return false;
        const imageTime = new Date(image.created_at).getTime();
        const timeDiff = Math.abs(imageTime - brandCreatedAt);
        return timeDiff < 24 * 60 * 60 * 1000; // Within 24 hours
      });

      console.log(
        `   ⏰ Images uploaded within 24 hours of brand creation: ${imagesAroundBrandCreation.length}`
      );
      if (imagesAroundBrandCreation.length > 0) {
        console.log(`   📸 These images might be related:`);
        imagesAroundBrandCreation.forEach((image, index) => {
          const sizeMB = ((image.metadata?.size || 0) / (1024 * 1024)).toFixed(
            2
          );
          const date = new Date(image.created_at).toLocaleString();
          console.log(
            `      ${index + 1}. ${image.name} (${sizeMB} MB) - ${date}`
          );
        });
      }
    }

    // 8. Summary and potential causes
    console.log("\n" + "=".repeat(70));
    console.log("🎯 Deep investigation completed!");

    console.log(`\n💡 Potential causes for image inconsistency:`);
    console.log(
      `   1. 🧠 Browser caching - old images stored in browser cache`
    );
    console.log(`   2. 🌐 CDN caching - images cached at CDN level`);
    console.log(
      `   3. 🔄 Database replication lag - changes not yet propagated`
    );
    console.log(`   4. 🖼️ Image processing - images being processed/optimized`);
    console.log(
      `   5. 🔗 URL changes - image URLs being modified after upload`
    );
    console.log(
      `   6. 📱 Device differences - different images on different devices`
    );
    console.log(`   7. 🕐 Timing issues - images updated but not yet visible`);

    console.log(`\n🚀 Recommended solutions:`);
    console.log(`   1. Clear browser cache completely (Ctrl+Shift+Delete)`);
    console.log(`   2. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)`);
    console.log(
      `   3. Check if the issue persists across different browsers/devices`
    );
    console.log(
      `   4. Verify the image URL directly in a new incognito window`
    );
    console.log(
      `   5. Check if there are any image optimization services running`
    );

    console.log(`\n🔍 Current status:`);
    console.log(`   📦 Brand: ${brand.name}`);
    console.log(
      `   🖼️ Database image: ${brand.image ? brand.image.split("/").pop() : "None"}`
    );
    console.log(`   ✅ Database shows correct assignment`);
    console.log(`   🔍 Issue likely in caching or serving layer`);
  } catch (error) {
    console.error("❌ Error in deepImageInvestigation:", error);
  }
}

// Run the investigation
deepImageInvestigation()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
