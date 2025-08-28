const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceRefreshImages() {
  try {
    console.log('🔄 Force refreshing brand images...\n');

    // 1. Check current state
    console.log('📊 Checking current brand images state...');
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('id, name, image')
      .limit(10);

    if (brandsError) {
      console.error('❌ Error fetching brands:', brandsError);
      return;
    }

    console.log(`✅ Found ${brands.length} brands`);
    brands.forEach(brand => {
      console.log(`  - ${brand.name}: ${brand.image}`);
    });

    // 2. Check brand_images table
    console.log('\n🖼️ Checking brand_images table...');
    const { data: brandImages, error: brandImagesError } = await supabase
      .from('brand_images')
      .select('brand_id, storage_path')
      .limit(10);

    if (brandImagesError) {
      console.error('❌ Error fetching brand_images:', brandImagesError);
      return;
    }

    console.log(`✅ Found ${brandImages.length} brand_images entries`);

    // 3. Test a few specific URLs
    console.log('\n🧪 Testing specific image URLs...');
    
    const testBrands = ['Kisara', 'Shopkhoi', 'Daez', 'Andi'];
    
    for (const brandName of testBrands) {
      console.log(`\n🔍 Testing: ${brandName}`);
      
      // Find the brand
      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .select('id, name, image')
        .ilike('name', `%${brandName}%`)
        .single();

      if (brandError) {
        console.error(`  ❌ Error finding brand: ${brandError.message}`);
        continue;
      }

      console.log(`  ✅ Brand found: ${brand.name}`);
      console.log(`  📷 Image URL: ${brand.image}`);
      
      // Test the URL
      try {
        const response = await fetch(brand.image, { method: 'HEAD' });
        console.log(`  🌐 Response status: ${response.status}`);
        
        if (response.ok) {
          console.log(`  ✅ Image accessible`);
        } else {
          console.log(`  ❌ Image not accessible (${response.status})`);
        }
      } catch (error) {
        console.error(`  ❌ Error testing URL: ${error.message}`);
      }
    }

    // 4. Check if there are any storage access issues
    console.log('\n🔐 Checking storage access...');
    
    // Try to list files in storage
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('brand-assets')
      .list('brands', { limit: 5 });

    if (storageError) {
      console.error('❌ Error listing storage:', storageError);
    } else {
      console.log(`✅ Storage accessible, found ${storageFiles.length} files`);
      storageFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.name}`);
      });
    }

    // 5. Test a direct storage URL
    if (storageFiles && storageFiles.length > 0) {
      const testFile = storageFiles[0];
      const testUrl = `${supabaseUrl}/storage/v1/object/public/brand-assets/brands/${testFile.name}`;
      
      console.log(`\n🧪 Testing direct storage URL: ${testUrl}`);
      
      try {
        const response = await fetch(testUrl, { method: 'HEAD' });
        console.log(`Response status: ${response.status}`);
        
        if (response.ok) {
          console.log('✅ Direct storage access works');
        } else {
          console.log('❌ Direct storage access failed');
        }
      } catch (error) {
        console.error('❌ Error testing direct storage:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

forceRefreshImages();
