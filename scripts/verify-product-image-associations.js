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

async function verifyProductImageAssociations() {
  try {
    console.log("🔍 Verifying product image associations...");
    console.log("======================================================================");

    // Step 1: Get all products with their images and brand info
    console.log("\n📋 Step 1: Fetching all products...");
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(`
        id,
        title,
        category,
        image,
        images,
        brand_id,
        brand:brands(name, location)
      `)
      .order("title");

    if (productsError) {
      console.error("❌ Error fetching products:", productsError);
      return;
    }

    console.log(`✅ Found ${products.length} products`);

    // Step 2: Analyze each product for potential image mismatches
    console.log("\n🔍 Step 2: Analyzing product-image associations...");
    
    let potentialIssues = [];
    let verifiedProducts = [];

    for (const product of products) {
      const productTitle = product.title.toLowerCase();
      const productCategory = product.category?.toLowerCase() || "";
      const imageUrl = product.image || "";
      const imageFilename = imageUrl.split("/").pop() || "";
      
      // Check for potential mismatches based on naming patterns
      let hasPotentialIssue = false;
      let issueReason = "";

      // Check if image filename seems unrelated to product
      if (imageFilename && !imageFilename.includes("placeholder")) {
        // Look for patterns that suggest mismatch
        const filenameLower = imageFilename.toLowerCase();
        
        // Check if filename contains brand names that don't match
        if (product.brand?.name) {
          const brandNameLower = product.brand.name.toLowerCase();
          const brandWords = brandNameLower.split(/\s+/);
          
          // Check if filename contains brand-related words that don't match
          const hasBrandMismatch = brandWords.some(word => 
            word.length > 3 && filenameLower.includes(word) && 
            !productTitle.includes(word)
          );
          
          if (hasBrandMismatch) {
            hasPotentialIssue = true;
            issueReason = `Filename contains brand words that don't match product title`;
          }
        }

        // Check if category seems mismatched with image content hints
        if (productCategory && imageFilename) {
          const categoryImageMismatches = {
            'bridal': ['casual', 'streetwear', 'sportswear'],
            'casual': ['bridal', 'formal', 'evening'],
            'formal': ['casual', 'sportswear', 'beachwear'],
            'accessories': ['dresses', 'suits', 'outerwear']
          };
          
          const mismatchedCategories = categoryImageMismatches[productCategory] || [];
          const hasCategoryMismatch = mismatchedCategories.some(mismatch => 
            filenameLower.includes(mismatch)
          );
          
          if (hasCategoryMismatch) {
            hasPotentialIssue = true;
            issueReason = `Image filename suggests ${mismatchedCategories.find(m => filenameLower.includes(m))} category, but product is ${productCategory}`;
          }
        }

        // Check for obvious filename mismatches (e.g., wrong product names in filename)
        const commonProductWords = ['dress', 'shirt', 'pants', 'skirt', 'suit', 'bag', 'accessory'];
        const hasProductNameMismatch = commonProductWords.some(word => {
          if (filenameLower.includes(word) && !productTitle.includes(word)) {
            // Check if this is a significant mismatch
            const productWords = productTitle.split(/\s+/);
            const hasSomeOverlap = productWords.some(pWord => 
              pWord.length > 3 && filenameLower.includes(pWord)
            );
            return !hasSomeOverlap; // Only flag if there's no meaningful overlap
          }
          return false;
        });

        if (hasProductNameMismatch) {
          hasPotentialIssue = true;
          issueReason = `Image filename contains product type words that don't match product title`;
        }
      }

      if (hasPotentialIssue) {
        potentialIssues.push({
          product: product.title,
          brand: product.brand?.name || 'Unknown',
          category: product.category || 'Unknown',
          image: imageFilename,
          reason: issueReason
        });
      } else {
        verifiedProducts.push({
          product: product.title,
          brand: product.brand?.name || 'Unknown',
          image: imageFilename
        });
      }
    }

    // Step 3: Display results
    console.log("\n📊 Step 3: Analysis results...");
    
    if (potentialIssues.length > 0) {
      console.log(`\n⚠️  Potential image mismatches found: ${potentialIssues.length}`);
      potentialIssues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.product} (${issue.brand})`);
        console.log(`   Category: ${issue.category}`);
        console.log(`   Image: ${issue.image}`);
        console.log(`   Issue: ${issue.reason}`);
      });
    } else {
      console.log("✅ No potential image mismatches detected!");
    }

    console.log(`\n✅ Verified products: ${verifiedProducts.length}`);
    console.log("📋 Sample verified products (first 10):");
    verifiedProducts.slice(0, 10).forEach(product => {
      console.log(`   - ${product.product} (${product.brand}): ${product.image}`);
    });

    // Step 4: Check for products with missing or placeholder images
    console.log("\n🔍 Step 4: Checking for missing/placeholder images...");
    const productsWithIssues = products.filter(p => 
      !p.image || 
      p.image.includes("placeholder") || 
      p.image.includes("default")
    );

    if (productsWithIssues.length > 0) {
      console.log(`⚠️  Products with missing/placeholder images: ${productsWithIssues.length}`);
      productsWithIssues.forEach(product => {
        console.log(`   - ${product.title} (${product.brand?.name || 'Unknown'}): ${product.image || 'No image'}`);
      });
    } else {
      console.log("✅ All products have proper images");
    }

    // Step 5: Check for duplicate images across different products
    console.log("\n🔍 Step 5: Checking for duplicate images...");
    const imageUsage = {};
    products.forEach(product => {
      if (product.image) {
        if (!imageUsage[product.image]) {
          imageUsage[product.image] = [];
        }
        imageUsage[product.image].push(product.title);
      }
    });

    const duplicateImages = Object.entries(imageUsage).filter(([image, products]) => products.length > 1);
    if (duplicateImages.length > 0) {
      console.log(`⚠️  Found ${duplicateImages.length} images used by multiple products:`);
      duplicateImages.forEach(([image, products]) => {
        console.log(`   Image: ${image.split('/').pop()}`);
        console.log(`   Used by: ${products.join(', ')}`);
      });
    } else {
      console.log("✅ No duplicate images found");
    }

    console.log("\n======================================================================");
    console.log("🎯 Product image association verification completed!");
    console.log(`📊 Summary: ${verifiedProducts.length} verified, ${potentialIssues.length} potential issues`);
    console.log("🏁 Script completed");

  } catch (error) {
    console.error("❌ Script error:", error);
  }
}

// Run the script
verifyProductImageAssociations();
