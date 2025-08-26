const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBrandImages() {
  console.log('🔍 Checking brand images...');
  
  try {
    // Fetch all brands
    const { data: brands, error } = await supabase
      .from('brands')
      .select('id, name, image, category, location');
    
    if (error) {
      console.error('❌ Error fetching brands:', error);
      return;
    }
    
    console.log(`📊 Found ${brands.length} brands`);
    
    // Check each brand's image
    const brandsWithIssues = [];
    const brandsWithGoodImages = [];
    
    for (const brand of brands) {
      if (!brand.image) {
        brandsWithIssues.push({
          ...brand,
          issue: 'No image field'
        });
      } else if (brand.image.includes('placeholder') || brand.image.includes('via.placeholder.com')) {
        brandsWithIssues.push({
          ...brand,
          issue: 'Placeholder image'
        });
      } else if (brand.image.startsWith('/')) {
        brandsWithIssues.push({
          ...brand,
          issue: 'Local path (should be full URL)'
        });
      } else if (!brand.image.startsWith('http')) {
        brandsWithIssues.push({
          ...brand,
          issue: 'Invalid URL format'
        });
      } else {
        brandsWithGoodImages.push(brand);
      }
    }
    
    console.log('\n✅ Brands with good images:', brandsWithGoodImages.length);
    brandsWithGoodImages.forEach(brand => {
      console.log(`  - ${brand.name} (${brand.category})`);
    });
    
    console.log('\n❌ Brands with image issues:', brandsWithIssues.length);
    brandsWithIssues.forEach(brand => {
      console.log(`  - ${brand.name} (${brand.category}): ${brand.issue}`);
      if (brand.image) {
        console.log(`    Current image: ${brand.image}`);
      }
    });
    
    return { brandsWithIssues, brandsWithGoodImages };
    
  } catch (error) {
    console.error('❌ Error checking brand images:', error);
  }
}

async function fixBrandImages() {
  console.log('\n🔧 Fixing brand images...');
  
  try {
    // Get brands with issues
    const { brandsWithIssues } = await checkBrandImages();
    
    if (!brandsWithIssues || brandsWithIssues.length === 0) {
      console.log('✅ No brands need fixing');
      return;
    }
    
    // For each brand with issues, try to find a suitable image
    for (const brand of brandsWithIssues) {
      console.log(`\n🔧 Fixing ${brand.name}...`);
      
      // Try to find a product image for this brand
      const { data: products } = await supabase
        .from('products')
        .select('image')
        .eq('brand_id', brand.id)
        .not('image', 'is', null)
        .limit(1);
      
      if (products && products.length > 0 && products[0].image) {
        console.log(`  📸 Found product image: ${products[0].image}`);
        
        // Update brand with product image
        const { error: updateError } = await supabase
          .from('brands')
          .update({ image: products[0].image })
          .eq('id', brand.id);
        
        if (updateError) {
          console.error(`  ❌ Failed to update ${brand.name}:`, updateError);
        } else {
          console.log(`  ✅ Updated ${brand.name} with product image`);
        }
      } else {
        // Try to find a collection image for this brand
        const { data: collections } = await supabase
          .from('catalogues')
          .select('image')
          .eq('brand_id', brand.id)
          .not('image', 'is', null)
          .limit(1);
        
        if (collections && collections.length > 0 && collections[0].image) {
          console.log(`  🖼️ Found collection image: ${collections[0].image}`);
          
          // Update brand with collection image
          const { error: updateError } = await supabase
            .from('brands')
            .update({ image: collections[0].image })
            .eq('id', brand.id);
          
          if (updateError) {
            console.error(`  ❌ Failed to update ${brand.name}:`, updateError);
          } else {
            console.log(`  ✅ Updated ${brand.name} with collection image`);
          }
        } else {
          console.log(`  ⚠️ No suitable image found for ${brand.name}`);
          
          // Set a default placeholder based on category
          let defaultImage = 'https://via.placeholder.com/400x500?text=Brand+Image';
          
          if (brand.category?.toLowerCase().includes('fashion')) {
            defaultImage = 'https://via.placeholder.com/400x500?text=Fashion+Brand';
          } else if (brand.category?.toLowerCase().includes('designer')) {
            defaultImage = 'https://via.placeholder.com/400x500?text=Designer+Brand';
          }
          
          const { error: updateError } = await supabase
            .from('brands')
            .update({ image: defaultImage })
            .eq('id', brand.id);
          
          if (updateError) {
            console.error(`  ❌ Failed to set default image for ${brand.name}:`, updateError);
          } else {
            console.log(`  ✅ Set default image for ${brand.name}`);
          }
        }
      }
    }
    
    console.log('\n✅ Brand image fixing completed');
    
  } catch (error) {
    console.error('❌ Error fixing brand images:', error);
  }
}

async function main() {
  console.log('🚀 Starting brand image check and fix...\n');
  
  // First check current state
  await checkBrandImages();
  
  // Then fix issues
  await fixBrandImages();
  
  // Check final state
  console.log('\n🔍 Final check...');
  await checkBrandImages();
  
  console.log('\n✨ Brand image check and fix completed!');
}

main().catch(console.error);
