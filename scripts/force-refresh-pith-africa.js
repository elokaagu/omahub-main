const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function forceRefreshPithAfrica() {
  console.log('🔄 Force refreshing PITH AFRICA data...\n');

  try {
    // Step 1: Get PITH AFRICA brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('name', 'PITH AFRICA')
      .single();

    if (brandError) {
      console.error('❌ Error fetching PITH AFRICA brand:', brandError);
      return;
    }

    console.log('✅ Found PITH AFRICA brand:', brand.name);
    console.log('  Current currency:', brand.currency);
    console.log('  Current price_range:', brand.price_range);

    // Step 2: Force update brand currency and price range
    console.log('\n🔄 Updating brand currency and price range...');
    
    const { error: brandUpdateError } = await supabase
      .from('brands')
      .update({ 
        currency: 'USD',
        price_range: '$75 - $75',
        updated_at: new Date().toISOString()
      })
      .eq('id', brand.id);

    if (brandUpdateError) {
      console.error('❌ Failed to update brand:', brandUpdateError);
      return;
    }

    console.log('✅ Brand updated successfully');

    // Step 3: Get and update all PITH AFRICA products
    console.log('\n🔄 Updating PITH AFRICA products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('brand_id', brand.id);

    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return;
    }

    console.log(`✅ Found ${products.length} products to update`);

    for (const product of products) {
      console.log(`  Updating ${product.title}...`);
      
      const { error: productUpdateError } = await supabase
        .from('products')
        .update({ 
          currency: 'USD',
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (productUpdateError) {
        console.error(`❌ Failed to update ${product.title}:`, productUpdateError);
      } else {
        console.log(`  ✅ ${product.title} updated successfully`);
      }
    }

    // Step 4: Verify the updates
    console.log('\n🔍 Verifying updates...');
    
    const { data: updatedBrand, error: verifyBrandError } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brand.id)
      .single();

    if (verifyBrandError) {
      console.error('❌ Error verifying brand update:', verifyBrandError);
    } else {
      console.log('✅ Brand verification:');
      console.log('  Currency:', updatedBrand.currency);
      console.log('  Price Range:', updatedBrand.price_range);
    }

    const { data: updatedProducts, error: verifyProductsError } = await supabase
      .from('products')
      .select('*')
      .eq('brand_id', brand.id);

    if (verifyProductsError) {
      console.error('❌ Error verifying product updates:', verifyProductsError);
    } else {
      console.log('✅ Product verification:');
      updatedProducts.forEach(product => {
        console.log(`  ${product.title}: currency = ${product.currency}, price = ${product.price}`);
      });
    }

    console.log('\n🎯 Force refresh complete!');
    console.log('💡 Now refresh your browser and check the product page.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

forceRefreshPithAfrica();
