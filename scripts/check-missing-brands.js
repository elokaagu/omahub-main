const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMissingBrands() {
  try {
    console.log('🔍 Checking which brands are missing from brand_images table...\n');

    // 1. Get all brands
    console.log('📊 Fetching all brands...');
    const { data: allBrands, error: brandsError } = await supabase
      .from('brands')
      .select('id, name')
      .order('name');

    if (brandsError) {
      console.error('❌ Error fetching brands:', brandsError);
      return;
    }

    console.log(`✅ Found ${allBrands.length} total brands`);

    // 2. Get all brand_images entries
    console.log('\n🖼️ Fetching brand_images entries...');
    const { data: brandImages, error: brandImagesError } = await supabase
      .from('brand_images')
      .select('brand_id, storage_path');

    if (brandImagesError) {
      console.error('❌ Error fetching brand_images:', brandImagesError);
      return;
    }

    console.log(`✅ Found ${brandImages.length} brand_images entries`);

    // 3. Find brands without images
    const brandsWithImages = new Set(brandImages.map(img => img.brand_id));
    const brandsWithoutImages = allBrands.filter(brand => !brandsWithImages.has(brand.id));

    console.log('\n📋 ANALYSIS:');
    console.log(`  - Total brands: ${allBrands.length}`);
    console.log(`  - Brands with images: ${brandsWithImages.size}`);
    console.log(`  - Brands without images: ${brandsWithoutImages.length}`);

    if (brandsWithoutImages.length > 0) {
      console.log('\n❌ BRANDS MISSING IMAGES:');
      brandsWithoutImages.forEach((brand, index) => {
        console.log(`  ${index + 1}. ${brand.name} (ID: ${brand.id})`);
      });

      console.log('\n💡 RECOMMENDATION:');
      console.log('  These brands need brand_images entries to display images on the homepage.');
    } else {
      console.log('\n✅ All brands have images!');
    }

    // 4. Check for any brands with old 'image' field that might still be used
    console.log('\n🔍 Checking for brands with old image field...');
    const { data: brandsWithOldImage, error: oldImageError } = await supabase
      .from('brands')
      .select('id, name, image')
      .not('image', 'is', null)
      .not('image', 'eq', '');

    if (oldImageError) {
      console.error('❌ Error checking old image field:', oldImageError);
    } else {
      console.log(`Found ${brandsWithOldImage.length} brands with old image field:`);
      brandsWithOldImage.forEach(brand => {
        console.log(`  - ${brand.name}: ${brand.image}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkMissingBrands();
